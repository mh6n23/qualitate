'use client';

import {useEffect, SyntheticEvent} from "react";
import {useAtom} from "jotai";
import axios from 'axios';
import Link from 'next/link';

import {
    projectsAtom,
    isModalOpenAtom,
    projectNameAtom,
    projectDescAtom
} from "@/app/atoms";

interface Project
{
    id: number;
    name: string;
    description: string;
}

export default function ProjectList() {
    const [projects, setProjects] = useAtom(projectsAtom); // Initialised empty
    const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);

    // Form inputs
    const [name, setName] = useAtom(projectNameAtom);
    const [desc, setDesc] = useAtom(projectDescAtom);

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
        <div className="w-full">
            <div className="relative flex items-center justify-center">
                <h1 className="page-title">Projects</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="new-project-button">+ New Project</button>
            </div>

            <table className="project-table">
                <thead>
                    <tr>
                        <th>Project Name</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => (
                        <tr key = {project.id}>
                            <td>
                                <Link href={`/project/${project.id}`}>{project.name}</Link>
                            </td>
                            <td>
                                {project.description}
                            </td>
                        </tr>
                    ))}
                    {projects.length === 0 && (
                        <tr>
                            <td>No projects found.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{textAlign: 'center'}}>Add Project</h2>
                        <form onSubmit={handleCreate}>
                            <div>
                                <label>Name:</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} required/>
                            </div>
                            <div>
                                <label>Description:</label>
                                <input value={desc} onChange={(e) => setDesc(e.target.value)}/>
                            </div>
                            <div className = "modal-buttons">
                                <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit">Save</button>
                            </div>

                        </form>
                    </div>
                    </div>
            )}
        </div>

    );
}