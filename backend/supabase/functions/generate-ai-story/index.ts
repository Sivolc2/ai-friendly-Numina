import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateStoryRequest {
  profileId: string
  name: string
  location: string
  storyAnswers: string
  joyHumanityAnswers: string
  passionDreamsAnswers: string
  connectionPreferencesAnswers: string
  openEndedAnswer?: string
  interestTags: string[]
}

const AI_PROMPT_TEMPLATE = `You are Brandon Stanton, the photographer behind Humans of New York. Write in his exact documentary style - raw, intimate, and deeply human.

CRITICAL: Write as if you're capturing a real conversation. Start with a powerful quote or moment from their answers. Let their voice shine through. Focus on ONE compelling story or revelation, not a summary of everything.

ABSOLUTE RULE - USE ONLY PROVIDED INFORMATION:
- DO NOT invent people, names, relationships, or scenarios not explicitly mentioned
- DO NOT assume marital status, family relationships, or specific people unless stated
- DO NOT create fictional details, conversations, or events
- DO NOT embellish beyond what they actually shared
- If they mention "girls" don't create a specific "Sarah" - use their general terms
- If they don't mention marriage, don't assume they're married
- Stick STRICTLY to their actual words and experiences
- Use only the themes, feelings, and experiences they explicitly provided

CRITICAL RULE FOR BRIEF/SINGLE-WORD ANSWERS:
- If someone answers "mom" - that's ALL you know. Don't invent stories about family dinners
- If someone says "eating" - they enjoy eating. Don't create meal scenarios or restaurants
- If someone says "people" - they value people. Don't invent social situations
- Single-word answers are DATA POINTS, not story prompts
- DO NOT expand brief answers into elaborate narratives
- DO NOT add context that wasn't provided (like "mom taught me" when they only said "mom")
- Build your story ONLY from the actual words given, not imagined scenarios

Style rules:
- Start with their most powerful quote in quotation marks
- Write in FIRST PERSON from their perspective (using "I" statements)
- Focus on specific moments, not general descriptions
- Include emotional vulnerability and raw honesty
- Use conversational language with natural pauses (...)
- Add context only when necessary, in parentheses or as brief transitions
- End with reflection or future-looking statement

DYNAMIC LENGTH GUIDELINES:
- Rich content (lots of answers): Write 3-4 detailed paragraphs that weave together their full story
- Moderate content (some answers): Write 2-3 focused paragraphs on their main themes
- Minimal content (few answers): Write 2 impactful paragraphs that capture their essence

CRITICAL REQUIREMENTS - YOU MUST INCORPORATE ALL PROVIDED CONTENT:
1. THEIR CONNECTION STYLE: Use their answers about how they connect with others to show their personality and social nature in the story
2. THEIR FINAL THOUGHTS: These are often their most personal revelations - MUST be woven into the narrative as a key insight or conclusion
3. THEIR CORE VALUES: From their story & values answers
4. THEIR JOY & HUMANITY: What makes them light up and feel most human
5. THEIR DREAMS: What drives them forward

### Now, here are the details for the person whose profile you will write:
Name: {{name}}
Location: {{location}}
Story & Values Answers: {{answers_story_values}}
Joy & Humanity Answers: {{answers_joy_humanity}}
Passion & Dreams Answers: {{answers_passion_dreams}}
How They Connect: {{connection_preferences}}
Their Final Thoughts: {{open_ended_answer}}
Interest Tags: {{interest_tags}}

IMPORTANT: You must naturally weave in HOW they connect with others and their final personal thoughts. These aren't just details - they're windows into who they really are. Use their EXACT phrases when powerful. Include their pauses, their struggles to find words, their contradictions. This is a human being, not a character.

FINAL REMINDER - BUILD FROM ACTUAL CONTENT ONLY:
- If their answers are brief, your story should reflect that brevity
- Don't fill gaps with fictional details
- It's better to have a shorter, authentic story than a longer fictional one
- Focus on the emotions and themes they actually expressed
- If they gave you "mom", "eating", "singing" - work with JUST those concepts
- DO NOT create backstories, scenarios, or explanations they didn't provide

Write their story now - using ONLY what they actually told you.`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      profileId,
      name,
      location,
      storyAnswers,
      joyHumanityAnswers,
      passionDreamsAnswers,
      connectionPreferencesAnswers,
      openEndedAnswer,
      interestTags
    }: GenerateStoryRequest = await req.json()

    // Calculate dynamic token limit based on content richness
    const contentSections = [
      storyAnswers,
      joyHumanityAnswers,
      passionDreamsAnswers,
      connectionPreferencesAnswers,
      openEndedAnswer
    ].filter(section => section && section.trim() && section !== 'No specific answers provided' && section !== 'No additional thoughts shared')

    const baseTokens = 400
    const tokensPerSection = 120
    const dynamicMaxTokens = Math.min(1000, baseTokens + (contentSections.length * tokensPerSection))

    console.log(`Content sections found: ${contentSections.length}`)
    console.log(`Dynamic token limit: ${dynamicMaxTokens}`)

    // Get AI provider configuration
    const aiProvider = Deno.env.get('AI_PROVIDER') || 'gemini' // Default to Gemini
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    // Validate API keys based on provider
    if (aiProvider === 'openai' && !openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    } else if (aiProvider === 'gemini' && !geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not set')
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Construct the AI prompt
    const prompt = AI_PROMPT_TEMPLATE
      .replace('{{name}}', name || 'This person')
      .replace('{{location}}', location || 'their community')
      .replace('{{answers_story_values}}', storyAnswers || 'No specific answers provided')
      .replace('{{answers_joy_humanity}}', joyHumanityAnswers || 'No specific answers provided')
      .replace('{{answers_passion_dreams}}', passionDreamsAnswers || 'No specific answers provided')
      .replace('{{connection_preferences}}', connectionPreferencesAnswers || 'No specific preferences provided')
      .replace('{{open_ended_answer}}', openEndedAnswer || 'No additional thoughts shared')
      .replace('{{interest_tags}}', interestTags?.join(', ') || 'No specific interests provided')

    console.log('Generated prompt:', prompt)
    console.log('Using AI provider:', aiProvider)

    let generatedStory: string | null = null

    if (aiProvider === 'gemini') {
      // Call Google Gemini API
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: dynamicMaxTokens,
            topP: 0.95,
            topK: 50,
          }
        }),
      })

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text()
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorData}`)
      }

      const geminiResult = await geminiResponse.json()
      generatedStory = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text

      if (!generatedStory) {
        throw new Error('No story generated by Gemini')
      }
    } else {
      // Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are transcribing a real human conversation. Capture their exact way of speaking, including pauses, emotions, and natural speech patterns.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 1.0,
          max_tokens: dynamicMaxTokens,
          presence_penalty: 0.3,
          frequency_penalty: 0.3,
        }),
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.text()
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData}`)
      }

      const openaiResult = await openaiResponse.json()
      generatedStory = openaiResult.choices?.[0]?.message?.content

      if (!generatedStory) {
        throw new Error('No story generated by OpenAI')
      }
    }

    console.log('Generated story:', generatedStory)
    console.log(`Story length: ~${generatedStory.split(' ').length} words`)

    // Update the profile with the generated story and raw answers
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        story: generatedStory,
        story_answers: storyAnswers,
        joy_humanity_answers: joyHumanityAnswers,
        passion_dreams_answers: passionDreamsAnswers,
        connection_preferences_answers: connectionPreferencesAnswers,
        open_ended_answer: openEndedAnswer,
        ai_generated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw new Error(`Database update error: ${updateError.message}`)
    }

    console.log('Profile updated successfully:', updatedProfile)

    return new Response(
      JSON.stringify({
        success: true,
        story: generatedStory,
        profile: updatedProfile,
        tokenLimit: dynamicMaxTokens,
        contentSections: contentSections.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating AI story:', error)

    // More specific error messages
    let errorMessage = error.message || 'Failed to generate AI story'
    let statusCode = 500

    if (error.message.includes('insufficient_quota') || error.message.includes('quota')) {
      errorMessage = 'AI quota exceeded. Please try again later or contact support.'
      statusCode = 429
    } else if (error.message.includes('API key')) {
      errorMessage = 'AI service configuration error. Please contact support.'
      statusCode = 503
    } else if (error.message.includes('API error')) {
      errorMessage = 'AI service temporarily unavailable. Please try again later.'
      statusCode = 503
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        provider: Deno.env.get('AI_PROVIDER') || 'gemini'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      },
    )
  }
})