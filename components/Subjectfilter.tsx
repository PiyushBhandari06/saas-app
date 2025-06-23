"use client";
import React, { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { subjects } from "@/constants";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";

const SubjectFilter = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get("subject") || "";

    const [subject, setSubject] = useState(query);

    // Update local state when URL changes
    useEffect(() => {
        const currentSubject = searchParams.get("subject") || "";
        setSubject(currentSubject);
    }, [searchParams]);

    // Update URL when subject changes
    useEffect(() => {
        // Don't update URL on initial load if subject is empty
        if (subject === query && !subject) return;

        let newUrl = "";
        if (subject === "all" || subject === "") {
            newUrl = removeKeysFromUrlQuery({
                params: searchParams.toString(),
                keysToRemove: ["subject"],
            });
        } else if (subject) {
            newUrl = formUrlQuery({
                params: searchParams.toString(),
                key: "subject",
                value: subject,
            });
        }

        if (newUrl) {
            router.push(newUrl, { scroll: false });
        }
    }, [subject, searchParams, router]);

    return (
        <Select onValueChange={setSubject} value={subject || "all"}>
            <SelectTrigger className="input capitalize">
                <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subjectItem) => (
                    <SelectItem key={subjectItem} value={subjectItem} className="capitalize">
                        {subjectItem}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default SubjectFilter;