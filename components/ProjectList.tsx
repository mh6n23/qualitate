'use client';

import {useState, useEffect, SyntheticEvent} from "react";

import axios from 'axios';
import Link from 'next/link';

interface Project
{
    id: number;
    name: string;
    description: string;
}

export default function ProjectList() {
    const [projects, setProjects] = useState<Project[]>([]); // Initialised empty
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form inputs
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    // Runs on page load
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Fetch all projects with the API
                const res = await axios.get('/api/projects');

                // Save projects to state
                setProjects(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchProjects();
    }, []);

    const handleCreate = async (e: SyntheticEvent) => {
        e.preventDefault();
        try
        {
            // Send project data to the backend
            const res = await axios.post('/api/projects', {name, description: desc});
            setProjects((prevProjects) => [res.data, ...prevProjects]);

            // Reset form
            setName('');
            setDesc('');
            setIsModalOpen(false);
        }
        catch (error)
        {
            alert("Error creating project");
            console.error(error);
        }

    };
}