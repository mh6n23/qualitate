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

    return (
        <div className="max-w-5xl mx-auto p-6">

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Projects</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Project</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="border p-6 rounded-lg shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                            <p className="text-gray-600 mb-4">{project.description || "No desc."}</p>
                        </div>
                        <Link href={`/project/${project.id}`} className={"text-blue-600 hover:underline text-sm font-semibold inline-block mt-2"}>Open Project</Link>
                    </div>

                ))}

                {projects.length === 0 && (
                    <p className="text-gray-500 col-span-full text-center py-10">
                    No projects yet. Click "New Project" to start.
                    </p>
                )}
                </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Create Project</h2>
                        <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1">Name</label>
                            <input
                                className="w-full border p-2 rounded"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1">Description</label>
                            <textarea className="w-full border p-2 rounded" value = {desc} onChange={e => setDesc(e.target.value)}/>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 px-3 py-1">Cancel</button>
                            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
                        </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
}