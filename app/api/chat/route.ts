import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'
import { withAuth, validateUserOwnership } from '@/lib/auth-middleware'

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {

    const body = await request.json()
    const { chatId, message, model, files, apiKeys } = body

    // Process files and determine if vision capabilities are needed
    let messageWithFiles = message
    let hasImages = false
    let imageFiles = []
    let textFiles = []
    
    if (files && files.length > 0) {
      for (const fileId of files) {
        const fileRecord = await prisma.file.findUnique({
          where: { id: fileId }
        })
        
        if (fileRecord) {
          if (fileRecord.mimeType.startsWith('image/')) {
            hasImages = true
            imageFiles.push(fileRecord)
          } else if (fileRecord.content) {
            textFiles.push(`File: ${fileRecord.originalName}\nContent: ${fileRecord.content}`)
          } else {
            textFiles.push(`File: ${fileRecord.originalName} (${fileRecord.mimeType})`)
          }
        }
      }
      
      // Add text file contents to message
      if (textFiles.length > 0) {
        messageWithFiles = `${message}\n\nAttached files:\n${textFiles.join('\n\n')}`
      }
    }

    // SECURITY: Verify chat ownership - prevents access to other users' chats
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id // Only find chats that belong to the authenticated user
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Get user memories for context (user-scoped for security)
    const memories = await prisma.memory.findMany({
      where: {
        userId: user.id // Only get memories that belong to the authenticated user
      },
      orderBy: { importance: 'desc' },
      take: 10
    })

    // Build conversation history
    const conversationHistory = chat.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }))

    // Add memory context
    if (memories.length > 0) {
      const memoryContext = memories
        .map(m => `${m.key}: ${m.value}`)
        .join('\n')
      
      conversationHistory.unshift({
        role: 'system',
        content: `Context about the user: ${memoryContext}`
      })
    }

    // Add current message
    conversationHistory.push({
      role: 'user',
      content: messageWithFiles
    })

    let aiResponse: string

    // Check if this is an image generation request
    const isImageRequest = detectImageGenerationRequest(messageWithFiles)
    console.log('=== IMAGE DETECTION DEBUG ===')
    console.log('Message:', messageWithFiles)
    console.log('Is Image Request:', isImageRequest)
    console.log('Current Model:', model)
    
    try {
      if (isImageRequest) {
        // Handle image generation with DALL-E 3
        const openaiKey = apiKeys?.openai || process.env.OPENAI_API_KEY
        if (!openaiKey) {
          return NextResponse.json({ error: 'OpenAI API key not configured for image generation' }, { status: 400 })
        }

        const openai = new OpenAI({ apiKey: openaiKey })
        
        // Extract the image description from the message
        const imagePrompt = extractImagePrompt(messageWithFiles)
        
        try {
          console.log('=== GENERATING IMAGE ===')
          console.log('OpenAI Key exists:', !!openaiKey)
          console.log('Image Prompt:', imagePrompt)
          
          // Try the standard DALL-E 3 API call with explicit parameters
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "url"
          })
          
          console.log('=== DALL-E RESPONSE ===')
          console.log('Full Response:', JSON.stringify(imageResponse, null, 2))
          console.log('Response Type:', typeof imageResponse)
          console.log('Response Keys:', Object.keys(imageResponse))
          if (imageResponse.data) {
            console.log('Data Array Length:', imageResponse.data.length)
            console.log('First Data Item:', JSON.stringify(imageResponse.data[0], null, 2))
          }
          
          // Check multiple possible response formats
          let imageUrl = null
          
          if (imageResponse.data && imageResponse.data[0] && imageResponse.data[0].url) {
            imageUrl = imageResponse.data[0].url
          } else if ((imageResponse as any).url) {
            imageUrl = (imageResponse as any).url
          } else if (imageResponse.data && imageResponse.data[0] && imageResponse.data[0].b64_json) {
            // Handle base64 response
            const base64Image = imageResponse.data[0].b64_json
            imageUrl = `data:image/png;base64,${base64Image}`
          }
          
          if (imageUrl) {
            aiResponse = `![Generated Image](${imageUrl})`
          } else {
            console.log('No image URL found. Full response:', JSON.stringify(imageResponse, null, 2))
            console.log('Response keys:', Object.keys(imageResponse))
            if (imageResponse.data && imageResponse.data[0]) {
              console.log('Data[0] keys:', Object.keys(imageResponse.data[0]))
            }
            aiResponse = "I was able to generate an image request, but couldn't retrieve the image URL. Please check your OpenAI API key permissions for DALL-E."
          }
        } catch (imageError: any) {
          console.error('DALL-E API Error:', imageError)
          aiResponse = `I apologize, but I encountered an error while trying to generate the image. Error: ${imageError.message || imageError}`
        }
      } else if (model === 'dall-e-3') {
        // Handle explicit DALL-E 3 selection
        const openaiKey = apiKeys?.openai || process.env.OPENAI_API_KEY
        if (!openaiKey) {
          return NextResponse.json({ error: 'OpenAI API key not configured for image generation' }, { status: 400 })
        }

        const openai = new OpenAI({ apiKey: openaiKey })
        
        try {
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: messageWithFiles,
            n: 1,
            size: "1024x1024",
            quality: "standard"
          })
          
          console.log('DALL-E explicit model response:', JSON.stringify(imageResponse, null, 2))
          
          // Check multiple possible response formats
          let imageUrl = null
          
          if (imageResponse.data && imageResponse.data[0] && imageResponse.data[0].url) {
            imageUrl = imageResponse.data[0].url
          } else if ((imageResponse as any).url) {
            imageUrl = (imageResponse as any).url
          } else if (imageResponse.data && imageResponse.data[0] && imageResponse.data[0].b64_json) {
            // Handle base64 response
            const base64Image = imageResponse.data[0].b64_json
            imageUrl = `data:image/png;base64,${base64Image}`
          }
          
          if (imageUrl) {
            aiResponse = `![Generated Image](${imageUrl})`
          } else {
            console.log('No image URL found in explicit model. Full response:', JSON.stringify(imageResponse, null, 2))
            console.log('Response keys:', Object.keys(imageResponse))
            if (imageResponse.data && imageResponse.data[0]) {
              console.log('Data[0] keys:', Object.keys(imageResponse.data[0]))
            }
            aiResponse = "I was able to generate an image request, but couldn't retrieve the image URL. Please check your OpenAI API key permissions for DALL-E."
          }
        } catch (imageError: any) {
          console.error('DALL-E API Error:', imageError)
          aiResponse = `I apologize, but I encountered an error while trying to generate the image. Error: ${imageError.message || imageError}`
        }
      } else if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')) {
        // Check for OpenAI API key
        const openaiKey = apiKeys?.openai || process.env.OPENAI_API_KEY
        if (!openaiKey) {
          return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 400 })
        }

        // OpenAI API
        const openai = new OpenAI({ apiKey: openaiKey })
        
        // o1, o3, and o4 models have different parameter requirements
        const isReasoningModel = model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')
        
        // Handle vision capabilities for GPT-4V and compatible models
        let finalMessages = conversationHistory
        
        if (hasImages && (model.includes('gpt-4') || model.includes('gpt-4o')) && !isReasoningModel) {
          // Create vision-enabled message for the user's latest message
          const content = [
            { type: 'text', text: messageWithFiles }
          ]
          
          // Add images to the content
          for (const imageFile of imageFiles) {
            // Convert file path to base64 for OpenAI Vision API
            const fs = require('fs')
            const imageBuffer = fs.readFileSync(imageFile.path)
            const base64Image = imageBuffer.toString('base64')
            
            content.push({
              type: 'image_url',
              image_url: {
                url: `data:${imageFile.mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            })
          }
          
          // Replace the last user message with vision content
          finalMessages = [...conversationHistory.slice(0, -1), {
            role: 'user',
            content: content
          }]
        }
        
        // o1/o3/o4 models don't support system messages, so filter them out
        const messages = isReasoningModel 
          ? finalMessages.filter(msg => msg.role !== 'system')
          : finalMessages
        
        const completion = await (openai.chat.completions.create as any)({
          model: model,
          messages: messages,
          max_tokens: isReasoningModel ? undefined : 1000, // o1/o3 models don't support max_tokens
          ...(isReasoningModel ? {} : { temperature: 0.7 }) // o1/o3 models don't support temperature
        })

        aiResponse = completion.choices[0]?.message?.content || 'No response generated'
      } else if (model.startsWith('claude-3') || model.startsWith('claude-4')) {
        // Check for Anthropic API key
        const anthropicKey = apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY
        if (!anthropicKey) {
          return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 400 })
        }

        // Anthropic API
        const anthropic = new Anthropic({ apiKey: anthropicKey })
        
        // Handle vision capabilities for Claude 3.5 Sonnet and Claude 4
        let finalMessages = conversationHistory.filter(msg => msg.role !== 'system')
        
        if (hasImages && (model.includes('claude-3.5-sonnet') || model.includes('claude-4'))) {
          // Create vision-enabled message for the user's latest message
          const content = [
            { type: 'text', text: messageWithFiles }
          ]
          
          // Add images to the content
          for (const imageFile of imageFiles) {
            // Convert file path to base64 for Claude Vision API
            const fs = require('fs')
            const imageBuffer = fs.readFileSync(imageFile.path)
            const base64Image = imageBuffer.toString('base64')
            
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageFile.mimeType,
                data: base64Image
              }
            })
          }
          
          // Replace the last user message with vision content
          finalMessages = [...finalMessages.slice(0, -1), {
            role: 'user',
            content: content
          }]
        }
        
        const response = await anthropic.messages.create({
          model: model,
          max_tokens: 1000,
          messages: finalMessages,
          system: conversationHistory.find(msg => msg.role === 'system')?.content,
        })

        aiResponse = response.content[0]?.type === 'text' 
          ? response.content[0].text 
          : 'No response generated'
      } else {
        return NextResponse.json({ error: 'Unsupported model' }, { status: 400 })
      }
    } catch (error) {
      console.error('AI API Error:', error)
      return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 })
    }

    // Extract insights for memory system
    await extractAndStoreMemories(user.id, message, aiResponse)

    // Update chat title if it's the first real message
    if (chat.messages.length === 0 || chat.title === 'New Chat') {
      const title = generateChatTitle(message)
      await prisma.chat.update({
        where: { id: chatId },
        data: { 
          title,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({ 
      content: aiResponse,
      model
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function extractAndStoreMemories(userId: string, userMessage: string, aiResponse: string) {
  try {
    // Simple keyword-based memory extraction
    const preferences = extractPreferences(userMessage)
    const facts = extractFacts(userMessage)

    for (const pref of preferences) {
      await prisma.memory.upsert({
        where: {
          userId_type_key: {
            userId,
            type: 'preference',
            key: pref.key
          }
        },
        create: {
          userId,
          type: 'preference',
          key: pref.key,
          value: pref.value,
          confidence: 0.7,
          importance: 0.6
        },
        update: {
          value: pref.value,
          confidence: 0.8,
          importance: 0.7,
          updatedAt: new Date()
        }
      })
    }

    for (const fact of facts) {
      await prisma.memory.upsert({
        where: {
          userId_type_key: {
            userId,
            type: 'fact',
            key: fact.key
          }
        },
        create: {
          userId,
          type: 'fact',
          key: fact.key,
          value: fact.value,
          confidence: 0.6,
          importance: 0.5
        },
        update: {
          value: fact.value,
          confidence: 0.7,
          importance: 0.6,
          updatedAt: new Date()
        }
      })
    }
  } catch (error) {
    console.error('Memory extraction error:', error)
  }
}

function extractPreferences(message: string): Array<{ key: string; value: string }> {
  const preferences = []
  const lower = message.toLowerCase()

  // Simple pattern matching for preferences
  if (lower.includes('i like') || lower.includes('i love')) {
    const match = lower.match(/i (?:like|love) ([^.!?]+)/g)
    if (match) {
      match.forEach(m => {
        const thing = m.replace(/i (?:like|love) /, '').trim()
        preferences.push({ key: 'likes', value: thing })
      })
    }
  }

  if (lower.includes('i prefer') || lower.includes('i would rather')) {
    const match = lower.match(/i (?:prefer|would rather) ([^.!?]+)/g)
    if (match) {
      match.forEach(m => {
        const thing = m.replace(/i (?:prefer|would rather) /, '').trim()
        preferences.push({ key: 'preferences', value: thing })
      })
    }
  }

  return preferences
}

function extractFacts(message: string): Array<{ key: string; value: string }> {
  const facts = []
  const lower = message.toLowerCase()

  // Extract personal information
  if (lower.includes('my name is') || lower.includes("i'm ")) {
    const nameMatch = lower.match(/(?:my name is|i'm) ([a-zA-Z]+)/g)
    if (nameMatch) {
      nameMatch.forEach(m => {
        const name = m.replace(/(?:my name is|i'm) /, '').trim()
        facts.push({ key: 'name', value: name })
      })
    }
  }

  if (lower.includes('i work') || lower.includes('my job')) {
    const jobMatch = lower.match(/(?:i work (?:as|at)|my job (?:is|at)) ([^.!?]+)/g)
    if (jobMatch) {
      jobMatch.forEach(m => {
        const job = m.replace(/(?:i work (?:as|at)|my job (?:is|at)) /, '').trim()
        facts.push({ key: 'occupation', value: job })
      })
    }
  }

  return facts
}

function generateChatTitle(message: string): string {
  const words = message.split(' ').slice(0, 6)
  let title = words.join(' ')
  
  if (title.length > 50) {
    title = title.substring(0, 50) + '...'
  }
  
  return title || 'New Chat'
}

function detectImageGenerationRequest(message: string): boolean {
  const lower = message.toLowerCase()
  
  // Comprehensive image generation keywords and phrases
  const imageKeywords = [
    'generate an image',
    'create an image', 
    'make an image',
    'draw an image',
    'create a picture',
    'generate a picture',
    'make a picture', 
    'draw a picture',
    'picture of',
    'image of',
    'photo of',
    'drawing of',
    'sketch of',
    'painting of',
    'illustration of',
    'create art',
    'generate art',
    'make art',
    'draw something',
    'create an illustration',
    'generate an illustration',
    'make an illustration',
    'can you draw',
    'can you create an image',
    'can you generate an image',
    'show me an image',
    'i want an image',
    'i need an image',
    'paint an image',
    'sketch an image',
    'design an image',
    'make a new image',
    'now make',
    'create another image',
    'generate another',
    'draw me',
    'show me a picture',
    'different building'
  ]
  
  console.log('Checking keywords against:', lower)
  const found = imageKeywords.find(keyword => lower.includes(keyword))
  if (found) {
    console.log('Found matching keyword:', found)
  }
  
  return imageKeywords.some(keyword => lower.includes(keyword))
}

function extractImagePrompt(message: string): string {
  const lower = message.toLowerCase()
  
  // Try to extract the description after common phrases
  const patterns = [
    /(?:generate an image of|create an image of|make an image of|draw an image of|create a picture of|generate a picture of|make a picture of|draw a picture of)\s*(.+)/i,
    /(?:picture of|image of|photo of|drawing of|sketch of|painting of|illustration of)\s*(.+)/i,
    /(?:generate an image|create an image|make an image|draw an image|create a picture|generate a picture|make a picture|draw a picture):\s*(.+)/i,
    /(?:can you (?:draw|create|generate|make))(?:\s+(?:an?\s+)?(?:image|picture|illustration))?\s+(?:of\s+)?(.+)/i,
    /(?:i want an image of|i need an image of|show me an image of|show me a picture of)\s*(.+)/i
  ]
  
  console.log('Extracting prompt from:', message)
  
  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      console.log('Matched pattern, extracted:', match[1].trim())
      return match[1].trim()
    }
  }
  
  // If no specific pattern matches, return the whole message (cleaned up)
  const cleaned = message.replace(/^(generate an image|create an image|make an image|draw an image|create a picture|generate a picture|make a picture|draw a picture|picture of|image of|photo of|can you draw|can you create an image|can you generate an image|show me an image|i want an image|i need an image|paint an image|sketch an image|design an image)[:\s]*/i, '').trim() || message
  console.log('No pattern matched, using cleaned message:', cleaned)
  return cleaned
}) 