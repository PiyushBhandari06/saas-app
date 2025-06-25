'use client';

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sdk';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react'
import soundwaves from '@/constants/soundwaves.json';
import { addToSessionHistory } from '@/lib/actions/companion.actions';

enum CallStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    CONNECTING = 'CONNECTING',
    FINISHED = 'FINISHED',
}

const CompanionComponent = ({companionId, subject, topic, name, userName, userImage, style, voice}:CompanionComponentProps) => {

    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);

    const [isMuted, setIsMuted] = useState(false);
    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if(lottieRef){
            if(isSpeaking){
                lottieRef.current?.play();
            }
            else {lottieRef.current?.stop();
            }
        }

    }, [isSpeaking, lottieRef])
    

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
            addToSessionHistory (companionId)
        }
        const onMessage = (Message: Message) => {
            if(Message.type === 'transcript' && Message.transcriptType === 'final'){
                const newMessage = { role : Message.role, content: Message.transcript}
                setMessages(prev => [newMessage, ...prev])
            }
        }

        const onSpeechStart = ()=>setIsSpeaking(true);
        const onSpeechEnd = ()=>setIsSpeaking(false);

        const onError = (error : Error) => console.log('Error:', error);

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('error', onError);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('error', onError);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
        }

    }, [])
    
    const toggleMicrophone = () =>{
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted);
    }

    const handleCall = async() => {
        try {
            setCallStatus(CallStatus.CONNECTING);
            console.log('Starting call with params:', { voice, style, topic, subject });

            const assistant = configureAssistant(voice, style);

            if (!assistant) {
                throw new Error('Failed to configure assistant');
            }

            // Replace template variables in the system message
            if (assistant.model?.messages?.[0]?.content) {
                assistant.model.messages[0].content = assistant.model.messages[0].content
                    .replace(/\{\{\s*topic\s*\}\}/g, topic)
                    .replace(/\{\{\s*subject\s*\}\}/g, subject)
                    .replace(/\{\{\s*style\s*\}\}/g, style);
            }

            // Replace template variables in the first message
            if (assistant.firstMessage) {
                assistant.firstMessage = assistant.firstMessage
                    .replace(/\{\{\s*topic\s*\}\}/g, topic);
            }

            console.log('Final assistant config:', assistant);

            await vapi.start(assistant);
            console.log('Vapi call started successfully');

        } catch (error) {
            console.error('Error starting call:', error);
            setCallStatus(CallStatus.INACTIVE);
            alert('Failed to start call. Please check console for details.');
        }
    }
    
    const handleDisconnect =async()=>{
        setCallStatus(CallStatus.FINISHED)
        vapi.stop()
    }

  return (
    <section className='flex flex-col h-[70vh]'>
        <section className='flex gap-8 max-sm:flex-col'>
            <div className='companion-section'>
                <div className='companion-avatar' style={{backgroundColor: getSubjectColor(subject)}}> 
                    <div className={
                        cn('absolute transition-opacity duration-1000', callStatus ===CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-1001': 'opacity-0', callStatus===CallStatus.CONNECTING && 'opacity-100 animate-pulse' )}>
                            <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className='max-sm: w-fit' />
                    </div>

                    <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100': 'opacity-0')}>
                        <Lottie
                            lottieRef={lottieRef}
                            animationData={soundwaves}
                            autoPlay={false}    
                            className='companion-lottie'
                        />

                    </div>
                </div>  
                <p className='text-2xl font-bold'>{name}</p>        

            </div>

            <div className=' user-section'>
                <div className='user-avatar'>
                    <Image src={userImage} alt={userName} width={130} height={130} className='rounded-lg'/>
                    <p className='font-bold text-2xl'>
                        {userName}
                    </p>
                </div>

                <button className='btn-mic' onClick={toggleMicrophone}>
                        <Image src={isMuted ? `/icons/mic-off.svg` : `/icons/mic-on.svg`} alt="mic" width={36} height={36} /> 
                        <p className='max-sm:hidden'>
                            {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
                        </p>
                </button>


                <button className={
                    cn('rounded-lg py-2 cursor-pointer transition-colors w-full text-white', callStatus===CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary', callStatus===CallStatus.CONNECTING && 'animate-pulse' )}
                    onClick = {callStatus===CallStatus.ACTIVE ? handleDisconnect : handleCall}>
                        {
                        callStatus==CallStatus.ACTIVE
                        ? 'End Session'
                        : callStatus===CallStatus.CONNECTING
                            ? 'Connecting...'
                            : 'Start Session'
                        }

                </button>
            </div>
        </section>
        
        <section className='Transcript'>
            <div className="transcript-message no-scrollbar">
                    {messages.map((message, index) => {
                        if(message.role === 'assistant') {
                            return (
                                <p key={index} className="max-sm:text-sm">
                                    {
                                        name
                                            .split(' ')[0]
                                            .replace('/[.,]/g, ','')
                                    }: {message.content}
                                </p>
                            )
                        } else {
                           return <p key={index} className="text-primary max-sm:text-sm">
                                {userName}: {message.content}
                            </p>
                        }
                    })}
                </div>

            <div className='transcript-fade'/>

        </section>
    </section>
  )
}

export default CompanionComponent