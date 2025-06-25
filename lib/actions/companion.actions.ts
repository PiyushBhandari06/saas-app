'use server';

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";

export const createCompanion = async (FormData: CreateCompanion) => {
    const { userId: author } = await auth();
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from('companions')
        .insert({ ...FormData, author })
        .select();

    if (error || !data) throw new Error(error?.message || 'Failed to create a companion');

    return data[0];
}
//here, companions limit:10, current page number:1 
export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions) => {
    const supabase = createSupabaseClient();

    // queries:-
    let query = supabase.from('companions').select();
    if (subject && topic) {
        query = query.ilike('subject', `%${subject}%`)
            .or(`topic.ilike.%${topic}%, name.ilike.%${topic}%`)
    } else if (subject) {
        query = query.ilike('subject', `%${subject}%`)
    } else if (topic) {
        query = query.or(`topic.ilike.%${topic}%, name.ilike.%${topic}%`)
    }

    // pagination queries:-
    query=query.range((page-1)*limit, page* limit-1);

    // data fetching:-
    const{data: companions, error} = await query;
    if(error) throw new Error(error.message);
    return companions;
}


export const getCompanion = async (id: string)=>{
    const supabase = createSupabaseClient();

    const {data, error} = await supabase
        .from('companions')
        .select()
        .eq('id', id);

    if(error) return console.log(error);

    return data[0]; 
}

export const addToSessionHistory = async (companionId : string)=> {
    const {userId} = await auth();
    const supabase = createSupabaseClient();

    const {data, error} = await supabase
        .from('session_history')
        .insert({companion_id : companionId, user_id : userId})
        .select();

    if(error) throw new Error(error.message);;

    return data;

}

export const getRecentSessions = async(limit = 10)=> {
    const supabase = createSupabaseClient();

    const {data, error} = await supabase
        .from('session_history')
        .select(`companions: companion_id(*)`)
        .order('created_at', {ascending : false})
        .limit(limit);

    if(error) throw new Error(error.message);

    const companions = data.map(({companions})=>companions).filter(Boolean);

    // Remove duplicates by companion ID
    const uniqueCompanions = companions.filter((companion: any, index, self) =>
        companion && index === self.findIndex((c: any) => c && c.id === companion.id)
    );

    return uniqueCompanions;

}

export const getuserSessions = async(userId : string, limit = 10)=> {
    const supabase = createSupabaseClient();

    const {data, error} = await supabase
        .from('session_history')
        .select(`companions: companion_id(*)`)
        .eq('user_id', userId)
        .order('created_at', {ascending : false})
        .limit(limit);

    if(error) throw new Error(error.message);

    const companions = data.map(({companions})=>companions).filter(Boolean);

    // Remove duplicates by companion ID
    const uniqueCompanions = companions.filter((companion: any, index, self) =>
        companion && index === self.findIndex((c: any) => c && c.id === companion.id)
    );

    return uniqueCompanions;

}

export const getuserCompanions = async(userId : string,)=> {
    const supabase = createSupabaseClient();

    const {data, error} = await supabase
        .from('companions')
        .select()
        .eq('author', userId)

    if(error) throw new Error(error.message);

    return data;

}

export const newCompanionPermissions = async () => {
    const { userId, has } = await auth();
    const supabase = createSupabaseClient();

    let limit = 0;

    if(has({ plan: 'pro' })) {
        return true;
    } else if(has({ feature: "3_companion_limit" })) {
        limit = 3;
    } else if(has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    const { data, error } = await supabase
        .from('companions')
        .select('id', { count: 'exact' })
        .eq('author', userId)

    if(error) throw new Error(error.message);

    const companionCount = data?.length;

    if(companionCount >= limit) {
        return false
    } else {
        return true;
    }
}