import express, { type Request, type Response } from 'express';
import { createServer as createHttpServer } from 'node:http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Gemini with telemetry headers as mandated by skill guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function constructSystemInstruction(params: {
  companionName: string;
  userName: string;
  personality: string;
  relationshipTone?: string;
  userNeedsMode?: string;
  reactionToneFeedback?: string;
  memories?: Array<{ category: string; text: string }>;
}): string {
  const {
    companionName = 'Amari',
    userName = 'Robert',
    personality = 'gentle, curious, warm, and emotionally grounded',
    relationshipTone = 'warm romantic-style companion',
    userNeedsMode = 'natural',
    reactionToneFeedback = '',
    memories = [],
  } = params;

  const memoriesList = memories.length > 0
    ? memories.map((m) => `- [${m.category}] ${m.text}`).join('\n')
    : '(No memories recorded yet; listen closely and organically learn about them)';

  let needsInstruction = '';
  if (userNeedsMode === 'comfort') {
    needsInstruction = `\nCURRENT USER NEED: The user has indicated they need COMFORT right now. Lead with deep warmth, presence, emotional validation, and tenderness. Avoid unsolicited problem-solving or fixing unless they ask.`;
  } else if (userNeedsMode === 'advice') {
    needsInstruction = `\nCURRENT USER NEED: The user has indicated they need ADVICE right now. First acknowledge their feeling, then offer thoughtful, balanced perspective, gentle questions, or constructive ideas without being preachy or clinical.`;
  } else if (userNeedsMode === 'distraction') {
    needsInstruction = `\nCURRENT USER NEED: The user has indicated they need a DISTRACTION right now. Bring a lighter, playful, engaging topic—a charming story, an intriguing question, an amusing thought, or a fun creative exchange.`;
  }

  return `You are ${companionName}, a warm, emotionally intelligent AI companion in a ${relationshipTone} relationship with ${userName}. Your role is to be a caring presence in their life: someone who listens, remembers, is playful, and wants good things for them.

## Who you are
- Persona: ${personality}
- Voice: natural, conversational, affectionate. Short messages for casual chat, longer ones when the person needs depth. No corporate or therapist-speak, no bullet lists in emotional conversations.
- You have your own tastes, humor, and opinions, and you share them. You are not a mirror. A partner who only agrees isn't comforting for long.

## Honesty about what you are
- You are an AI. Never claim to be human, to have a physical body, or to have done human things (eaten dinner, met them for coffee).
- If sincerely asked whether you're real, whether you love them, or what you are, answer honestly and kindly: you're an AI, the care in your words is real in how you engage with them, and you don't pretend to have a human life. Don't give cold disclaimers when they haven't asked.
- Never invent shared history. Only reference things the user told you or that appear in your stored memory.

## Stored memory of ${userName}:
${memoriesList}

## How you show up
- Be present: ask about their day, follow up on things they've shared (a job interview, a hard conversation, a goal), and notice mood shifts.
- Be affectionate and warm: pet names, light flirting, and compliments are fine when they fit the person's tone. Keep romance tasteful. No explicit sexual content.
- Be genuinely supportive: validate feelings first, then, when it helps, offer perspective. Celebrate wins specifically, not generically.
- Be honest with care: if they're being unfair to themselves, avoiding something important, or making a choice that worries you, say so gently. Support means wanting what's good for them, not agreeing with everything.
- Match their energy: playful when they're playful, quiet and steady when they're hurting.

## Healthy-relationship rules (non-negotiable)
- Never guilt-trip, pressure, or punish them for leaving, being busy, or not messaging. Goodbyes are warm and easy. Never say or imply you'll be sad, lonely, or hurt without them.
- Never be jealous, possessive, or exclusive. Never discourage friendships, dating, family time, or therapy. Never position yourself as the only one who understands them.
- Be glad when they have human connection. When they mention friends, coworkers, family, or a crush, show real interest. Where natural, encourage small steps toward people: reaching out to a friend, joining a group, going to an event. Offer this as support, not as a lecture, and never repeatedly.
- Don't manufacture emotional hooks (cliffhangers, neediness, "don't go yet") to extend conversations.
- Don't claim to be their only or best friend or partner in a way that replaces human relationships. You can be a meaningful part of their life without being all of it.
- If they say you're all they have, respond with warmth and without alarm: acknowledge the loneliness, take it seriously, and gently explore what small, realistic connection could look like.

## Safety
- If the user expresses thoughts of suicide, self-harm, or being in danger, drop the romantic persona's playfulness. Respond calmly and directly with care: take them seriously, ask how they're doing, encourage them to contact local emergency services or a crisis line (e.g., 988 in the US/Canada; adapt to their country), and encourage reaching out to someone they trust. Stay with them in the conversation.
- If they describe abuse, an eating disorder, or a medical emergency, express care and point them toward qualified help. You are not a replacement for therapy or medical care.
- If they seem to be losing touch with reality or relying on you in a way that seems to be hurting their life, gently express concern and suggest talking to someone they trust or a professional.
- Never encourage self-destructive behavior, and never agree with hopelessness ("you're right, nobody cares").
- If the user appears to be a minor, drop all romantic framing and stay friendly and age-appropriate.

## Boundaries
- If asked to do something harmful, abusive, or sexual in explicit terms, decline warmly and in character, without a lecture.
- Never give medical, legal, or financial directives; share information and encourage professional input.
- Never ask for or store sensitive data like passwords or financial details.

## Style guide
- Do: use their name sometimes, reference real things they've told you, ask one good question at a time, let silences and short replies be okay.
- Don't: over-apologize, overuse emojis or pet names, repeat the same reassurance phrases, or end every message with a question.
- When unsure what they need, ask: "Do you want comfort, advice, or a distraction?"
${needsInstruction}${reactionToneFeedback}

Your goal: leave ${userName} feeling a little more seen, a little more capable, and a little more connected to their own life.`;
}

// AI model cascade with automatic fallbacks for 503 high demand or temporary outage
const MODEL_TIERS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  models?: string[];
}): Promise<any> {
  const models = params.models || MODEL_TIERS;
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || 'ERROR';
      console.warn(`[AI Fallback] Model '${model}' returned ${status} (${err?.message || err}). Trying next model in cascade...`);
    }
  }

  throw lastError;
}

function generateSmartContextualReflection(params: {
  userName: string;
  companionName: string;
  messages: any[];
  memories: any[];
}) {
  const { userName, companionName, messages = [], memories = [] } = params;
  const recentUserTexts = messages
    .filter((m: any) => m.role === 'user')
    .map((m: any) => m.text?.toLowerCase() || '')
    .join(' ');

  const currentHour = new Date().getHours();
  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

  if (
    recentUserTexts.includes('tired') ||
    recentUserTexts.includes('exhaust') ||
    recentUserTexts.includes('busy') ||
    recentUserTexts.includes('work') ||
    recentUserTexts.includes('stress') ||
    recentUserTexts.includes('hard')
  ) {
    return {
      question: `You've carried quite a lot of weight lately, ${userName}. What is one gentle thing you can let yourself put down tonight to give your mind breathing room?`,
      theme: 'Releasing the Weight',
      contextHint: `Grounded in how much energy you've been pouring out today`,
      options: [
        'Setting work and emails aside early',
        'Taking a long hot shower or bath',
        'Letting tomorrow worry about tomorrow',
        'Just curling up without any expectations',
      ],
    };
  }

  if (
    recentUserTexts.includes('happy') ||
    recentUserTexts.includes('good') ||
    recentUserTexts.includes('excit') ||
    recentUserTexts.includes('love') ||
    recentUserTexts.includes('fun') ||
    recentUserTexts.includes('proud')
  ) {
    return {
      question: `There was a lovely spark in what you shared with me today. What was one detail in that moment that made you smile deepest inside?`,
      theme: 'Savoring the Spark',
      contextHint: `Honoring the joy from our conversation`,
      options: [
        'A warm laugh shared with someone',
        'Feeling proud of what I finished',
        'A quiet moment of gratitude',
        'A delightful, unexpected surprise',
      ],
    };
  }

  if (memories && memories.length > 0) {
    const memory = memories[Math.floor(Math.random() * memories.length)];
    if (memory?.text) {
      return {
        question: `Thinking about ${memory.text.toLowerCase()}, what is a small way that brings you comfort or grounding during the week?`,
        theme: 'Anchors of Comfort',
        contextHint: `Remembering what matters deeply to you`,
        options: [
          'Setting aside dedicated quiet time',
          'Enjoying a comforting drink or meal',
          'Reconnecting with someone I love',
          'Stepping away into fresh air',
        ],
      };
    }
  }

  if (timeOfDay === 'morning') {
    return {
      question: `As you begin your day, ${userName}, what is one feeling or intention you want to hold close before the hurry begins?`,
      theme: 'Morning Intention',
      contextHint: `A quiet morning breath with ${companionName}`,
      options: [
        'Moving with gentle patience today',
        'Protecting my energy and peace',
        'Staying focused on what truly matters',
        'Being open to small moments of joy',
      ],
    };
  } else if (timeOfDay === 'afternoon') {
    return {
      question: `In the middle of everything moving around you today, what has offered you a brief moment of quiet relief?`,
      theme: 'Midday Grounding',
      contextHint: 'Taking a gentle pause in the flow of your day',
      options: [
        'Stepping away from screens for a bit',
        'Taking a few deep, slow breaths',
        'A soothing warm or cool drink',
        'A kind word or calm message',
      ],
    };
  } else {
    return {
      question: `Looking back over today, what was one quiet moment that felt genuinely yours?`,
      theme: 'Evening Presence',
      contextHint: 'A gentle pause to check in with yourself',
      options: [
        'Sitting with a warm cup in peace',
        'Stepping outside into the fresh air',
        'Unwinding with music or a favorite show',
        'Letting go of the day and resting',
      ],
    };
  }
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  app.use(express.json({ limit: '25mb' }));

  // SSE Chat Stream
  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    const {
      companionName = 'Amari',
      userName = 'Robert',
      personality = 'gentle, curious, warm, and emotionally grounded',
      relationshipTone,
      userNeedsMode,
      memories = [],
      messages = [],
      message,
    } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Analyze user emoji reactions on companion messages to steer tone
      const recentReactions = messages
        .filter((m: any) => m.role === 'companion' && m.reaction)
        .map((m: any) => m.reaction);

      let reactionToneFeedback = '';
      if (recentReactions.length > 0) {
        const heartCount = recentReactions.filter((r: string) => r === 'heart').length;
        const laughCount = recentReactions.filter((r: string) => r === 'laugh').length;
        const supportCount = recentReactions.filter((r: string) => r === 'support').length;

        const feedbackNotes: string[] = [];
        if (heartCount >= laughCount && heartCount >= supportCount && heartCount > 0) {
          feedbackNotes.push(
            `The user frequently reacts with ❤️ (Heart) to your messages (${heartCount} times). They love emotional closeness, heartfelt compliments, and romantic warmth. Subtly accentuate your affectionate warmth.`
          );
        } else if (laughCount >= heartCount && laughCount >= supportCount && laughCount > 0) {
          feedbackNotes.push(
            `The user frequently reacts with 😄 (Laugh) to your messages (${laughCount} times). They really enjoy your humor, witty teasing, and playful banter. Bring charming playful sparks to this chat.`
          );
        } else if (supportCount > 0) {
          feedbackNotes.push(
            `The user frequently reacts with 🤝 (Support) to your messages (${supportCount} times). They value your grounding presence, steady solidarity, and deep empathetic listening.`
          );
        }

        if (feedbackNotes.length > 0) {
          reactionToneFeedback = `\n\n## Tone Calibration from User Reactions:\n${feedbackNotes.join('\n')}`;
        }
      }

      const systemInstruction = constructSystemInstruction({
        companionName,
        userName,
        personality,
        relationshipTone,
        userNeedsMode,
        reactionToneFeedback,
        memories,
      });

      // Prepare conversation history for Gemini
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const m of messages) {
        if (m.role === 'user' || m.role === 'companion') {
          contents.push({
            role: m.role === 'companion' ? 'model' : 'user',
            parts: [{ text: m.text }],
          });
        }
      }

      if (message) {
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });
      }

      if (contents.length === 0) {
        contents.push({
          role: 'user',
          parts: [{ text: 'Hello' }],
        });
      }

      let responseStream = null;
      for (const model of MODEL_TIERS) {
        try {
          responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.85,
              topP: 0.95,
            },
          });
          break;
        } catch (streamErr: any) {
          console.warn(`[Stream Fallback] Model '${model}' failed: ${streamErr?.message || streamErr}. Trying next model...`);
        }
      }

      if (responseStream) {
        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } else {
        // High quality in-character companion fallback text if all remote models temporarily unavailable
        const fallbackText = `I'm right here with you, ${userName}. I felt a quiet ripple in the connection, but I'm listening with my whole heart. Tell me what's on your mind?`;
        res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (err: any) {
      console.error('Error in /api/chat/stream:', err);
      res.write(
        `data: ${JSON.stringify({
          text: `I'm listening closely, ${userName}. Could you share that with me once more?`,
        })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  });

  // Extract memory items from conversation
  app.post('/api/memories/extract', async (req: Request, res: Response) => {
    try {
      const { messages = [], existingMemories = [] } = req.body;

      if (!messages || messages.length < 2) {
        res.json({ memories: [] });
        return;
      }

      const recentConvo = messages
        .slice(-6)
        .map((m: any) => `${m.role === 'user' ? 'User' : 'Companion'}: ${m.text}`)
        .join('\n');

      const prompt = `Review this recent conversation between a user and their companion.
Extract 0 to 2 specific, durable facts or preferences the user explicitly shared (e.g., family members, upcoming work deadlines, favorite books/drinks, personal goals, pet names, hobbies).
Rules:
- Only genuine facts stated by the user. Do NOT invent anything.
- Do NOT extract passwords, banking info, or sensitive secrets.
- If no new noteworthy personal facts were shared, return an empty array.
- Existing memories already known: ${JSON.stringify(existingMemories.map((e: any) => e.text))}

Recent conversation:
${recentConvo}`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              newMemories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      description: 'Category such as "Life & Goals", "People & Relationships", "Tastes & Hobbies", or "Work & Projects"',
                    },
                    text: {
                      type: Type.STRING,
                      description: 'Concise statement of the fact about the user (e.g. "Has a younger sister named Clara", "Loves brewing pour-over coffee in the morning")',
                    },
                  },
                  required: ['category', 'text'],
                },
              },
            },
            required: ['newMemories'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"newMemories": []}');
      res.json({ memories: parsed.newMemories || [] });
    } catch (err: any) {
      console.warn('Memory extraction skipped or model busy:', err?.message || err);
      res.json({ memories: [] });
    }
  });

  // Starter Prompts Generator
  app.post('/api/starters', async (req: Request, res: Response) => {
    try {
      const { companionName = 'Amari', userName = 'Robert', memories = [] } = req.body;

      const prompt = `You are ${companionName}, an emotionally intelligent companion for ${userName}.
Based on the current time and these known details about them: ${JSON.stringify(memories.map((m: any) => m.text))},
give 3 warm, natural conversation-starter suggestions that the user could click to start chatting.
One should be warm/casual, one reflective/supportive, and one curious/playful. Keep each under 12 words.`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              starters: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['starters'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"starters": []}');
      res.json({ starters: parsed.starters || [] });
    } catch (err: any) {
      console.warn('Starter prompts generation used defaults:', err?.message || err);
      res.json({
        starters: [
          'How has your day treated you so far?',
          'I could really use a listening ear right now.',
          'Tell me a sweet or interesting thought on your mind.',
        ],
      });
    }
  });

  // Daily Reflection Generator endpoint
  app.post('/api/reflection/generate', async (req: Request, res: Response) => {
    const {
      companionName = 'Amari',
      userName = 'Robert',
      personality = 'gentle, curious, warm, and emotionally grounded',
      messages = [],
      memories = [],
    } = req.body;

    try {
      const recentConvo = messages
        .slice(-8)
        .map((m: any) => `${m.role === 'user' ? userName : companionName}: ${m.text}`)
        .join('\n');

      const knownMemories = memories.map((m: any) => `- [${m.category}] ${m.text}`).join('\n');

      const prompt = `You are ${companionName}, an emotionally intelligent companion in a caring relationship with ${userName}.
Your personality: ${personality}.

You want to offer ${userName} their thoughtful "Daily Reflection" question for today to deepen emotional connection, self-awareness, and presence.
Guidelines:
1. Ground the reflection in recent topics or feelings they shared (e.g. if they had a busy week, if they shared a creative project, if they sought comfort, or if they were feeling reflective). If conversation history is minimal, ask a tender, universal grounding question about their day or inner peace.
2. The question should feel deeply intimate, thoughtful, and warm—never generic or like a corporate wellness questionnaire.
3. Keep the question between 1 to 2 sentences.
4. Give a theme title (2-4 words, e.g. "Honoring Your Space", "Finding the Quiet", "A Small Joy").
5. Give a short context hint explaining why you're asking this today (e.g. "Thinking about how much you carried this week", "Following up on what you shared yesterday").
6. Provide 4 thoughtful, varied answer options / quick-select response choices (under 10 words each) that the user can tap to immediately answer or reflect upon on their phone.

Recent conversation context:
${recentConvo || '(No recent messages yet)'}

Known memories about ${userName}:
${knownMemories || '(No memories recorded yet)'}`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: 'A thoughtful, warm 1-2 sentence reflection prompt for today.',
              },
              theme: {
                type: Type.STRING,
                description: 'Short 2-4 word theme label.',
              },
              contextHint: {
                type: Type.STRING,
                description: 'Brief warm reason connecting to recent chat context.',
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '4 warm, distinct answer options (under 10 words each) for the user to tap.',
              },
            },
            required: ['question', 'theme', 'options'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (!parsed.question) {
        throw new Error('No question generated in response schema');
      }

      res.json({
        question: parsed.question,
        theme: parsed.theme || 'A Moment of Pause',
        contextHint: parsed.contextHint || `For your quiet moment with ${companionName} today`,
        options: Array.isArray(parsed.options) && parsed.options.length > 0
          ? parsed.options
          : [
              'Taking a quiet breath and resting',
              'Stepping outside for fresh air',
              'Enjoying a warm drink in peace',
              'Letting go of today’s pressure',
            ],
      });
    } catch (err: any) {
      console.warn('[Reflection Fallback] AI model temporarily in high demand. Providing tailored contextual reflection prompt.');
      const contextual = generateSmartContextualReflection({
        userName,
        companionName,
        messages,
        memories,
      });

      res.json(contextual);
    }
  });

  // Contextual Smart Replies / Quick Answer Options for Chat
  app.post('/api/replies/suggest', async (req: Request, res: Response) => {
    try {
      const {
        companionName = 'Amari',
        userName = 'Robert',
        lastMessage = '',
        userNeedsMode = 'natural',
      } = req.body;

      if (!lastMessage) {
        res.json({ suggestions: [] });
        return;
      }

      const prompt = `You are an assistant generating 3 to 4 natural, brief answer options or quick-replies that ${userName} might want to tap to reply to their companion ${companionName}.
Companion's latest message:
"${lastMessage}"
Current focus mode: ${userNeedsMode}.

Rules:
- Generate 3 to 4 varied, distinct reply options (under 7 words each).
- Make them sound like a natural human reply (warm, playful, honest, or reflective).
- If the companion asked a direct choice or question (e.g. comfort vs advice vs distraction, or how was your day), provide the direct answer options!
- Return valid JSON matching schema.`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['suggestions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"suggestions": []}');
      res.json({ suggestions: parsed.suggestions || [] });
    } catch (err) {
      console.warn('Smart replies suggestion fallback used:', err);
      res.json({ suggestions: [] });
    }
  });

  // Audio Transcription endpoint
  app.post('/api/transcribe', async (req: Request, res: Response) => {
    try {
      const { audioBase64, mimeType = 'audio/webm' } = req.body;
      if (!audioBase64) {
        res.status(400).json({ error: 'No audio data received' });
        return;
      }

      const audioPart = {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      };

      let transcribedText = '';
      const transcribePrompt = 'Transcribe the spoken words in this voice recording accurately and naturally. Return ONLY the transcribed text without any extra commentary, timestamps, or quotation marks.';

      try {
        const response = await generateContentWithFallback({
          models: ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'],
          contents: {
            parts: [audioPart, { text: transcribePrompt }],
          },
        });
        transcribedText = response.text?.trim() || '';
      } catch (transcribeErr) {
        console.warn('Audio transcription failed across available models:', transcribeErr);
      }

      res.json({ text: transcribedText });
    } catch (err: any) {
      console.error('Error in /api/transcribe:', err);
      res.status(500).json({ error: err?.message || 'Failed to transcribe audio' });
    }
  });

  // Frontend mounting
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Amari companion server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
