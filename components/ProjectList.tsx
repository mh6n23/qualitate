'use client';

import {useEffect, SyntheticEvent, useState} from "react";
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
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingProjectID, setEditingProjectID] = useState<number | null>(null);

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

    function resetModal() {
        setName("");
        setDesc("");
        setIsModalOpen(false);
        setModalMode("create");
        setEditingProjectID(null);
    }

    function openCreateModal() {
        setName("");
        setDesc("");
        setModalMode("create");
        setEditingProjectID(null);
        setIsModalOpen(true);
    }

    function openEditModal(project: Project) {
        setName(project.name);
        setDesc(project.description || "");
        setModalMode("edit");
        setEditingProjectID(project.id);
        setIsModalOpen(true);
    }

    const handleCreate = async (e: SyntheticEvent) => {
        e.preventDefault();
        try
        {
            // Send project data to the backend
            const res = await axios.post('/api/projects', {name, description: desc});
            setProjects((prevProjects) => [res.data, ...prevProjects]);

            // Reset form
            resetModal();
        }
        catch (error)
        {
            alert("Error creating project");
            console.error(error);
        }

    };

    const handleUpdate = async (e: SyntheticEvent) => {
        e.preventDefault();

        if (editingProjectID == null) {
            alert("Haven't selected project to edit");
            return;
        }

        try
        {
            // Send project data to the backend
            const res = await axios.patch(`/api/projects/${editingProjectID}`, {name, description: desc});
            setProjects((prevProjects) => prevProjects.map((project) => project.id === editingProjectID ? res.data : project));

            resetModal();
        }
        catch (error)
        {
            alert("Error updating project");
            console.error(error);
        }
    }

    const handleDelete = async (e: SyntheticEvent) => {
        if (editingProjectID == null) {
            alert("Haven't selected project to delete");
            return;
        }

        const confirmation = window.confirm("Are you sure you want to delete this project and its contents?");

        if (!confirmation) {
            return;
        }

        try
        {
            // Send project data to the backend
            const res = await axios.delete(`/api/projects/${editingProjectID}`);
            setProjects((prevProjects) => prevProjects.filter((project) => project.id !== editingProjectID));

            resetModal();
        }
        catch (error)
        {
            alert("Error deleting project");
            console.error(error);
        }
    }

    return (
        <div className="w-full">
            <div className="relative flex items-center justify-center">
                <h1 className="page-title">Projects</h1>
                <button
                    onClick={() => openCreateModal()}
                    className="new-project-button">+ New Project</button>
            </div>

            <table className="project-table">
                <thead>
                    <tr>
                        <th>Project Name</th>
                        <th>Description</th>
                        <th></th>
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
                            <td>
                                <div className="flex justify-end">
                                    <button type="button" className="regular-button flex items-center justify-center"
                                    onClick={() => openEditModal(project)}>
                                        Edit
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {projects.length === 0 && (
                        <tr>
                            <td colSpan={3}>No projects found.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{textAlign: 'center'}}>
                            {modalMode === "edit" ? "Edit Project" : "Add Project"}
                        </h2>
                        <form onSubmit={modalMode === "edit" ? handleUpdate : handleCreate}>
                            <div>
                                <label>Name:</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} required/>
                            </div>
                            <div>
                                <label>Description:</label>
                                <input value={desc} onChange={(e) => setDesc(e.target.value)}/>
                            </div>
                            <div className = "modal-buttons">
                                <button type="button" onClick={() => resetModal()}>Cancel</button>

                                {modalMode === "edit" && (
                                    <button type="button" onClick={handleDelete}>Delete Project</button>
                                )}

                                <button type="submit">Save</button>
                            </div>

                        </form>
                    </div>
                    </div>
            )}
        </div>

    );
}