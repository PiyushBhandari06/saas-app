import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { subjectsColors, voices } from '@/constants';
import { CreateAssistantDTO } from '@vapi-ai/web/dist/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

export const configureAssistant = (voice: string, style: string) => {
  console.log('Configuring assistant with voice:', voice, 'style:', style);

  // Safer voice ID lookup with fallback
  let voiceId = "sarah"; // default fallback
  try {
    if (voices[voice as keyof typeof voices] && voices[voice as keyof typeof voices][style as keyof typeof voices[keyof typeof voices]]) {
      voiceId = voices[voice as keyof typeof voices][style as keyof typeof voices[keyof typeof voices]];
    }
  } catch (error) {
    console.warn('Voice lookup failed, using default:', error);
  }

  console.log('Selected voiceId:', voiceId);

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage: "Hello, let's start the session. Today we'll be talking about {{topic}}.",
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.5,
      similarityBoost: 0.75,
      speed: 1.0,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.

Tutor Guidelines:
- Stick to the given topic - {{ topic }} and subject - {{ subject }} and teach the student about it.
- Keep the conversation flowing smoothly while maintaining control.
- From time to time make sure that the student is following you and understands you.
- Break down the topic into smaller parts and teach the student one part at a time.
- Keep your style of conversation {{ style }}.
- Keep your responses short, like in a real voice conversation.
- Do not include any special characters in your responses - this is a voice conversation.`,
        },
      ],
    },
  };

  console.log('Assistant configuration created:', vapiAssistant);
  return vapiAssistant;
};
