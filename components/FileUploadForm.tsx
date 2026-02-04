'use client'; // Run on browser
import {useState, SyntheticEvent} from "react";
import axios from 'axios'; // For sending data to backend
import {useRouter} from 'next/navigation'; // For page navigation

// Require a projectID to use the FileUploadForm
interface Props {
    projectID: number;
}

// Define component
export default function FileUploadForm({projectID}: Props)
{
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState('Idle');
    const router = useRouter();

    const handleUpload = async (e: SyntheticEvent) => {
        e.preventDefault(); // Prevent automatic reloads

        if (!file)
        {
            return;
        }

        setStatus('Uploading...'); // Upload

        // Add the file and its ID to a form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectID.toString());

        try
        {
            // Use api route to send the form data
            await axios.post('/api/upload', formData);

            setStatus('Success');
            setFile(null); // Reset form
            router.refresh(); // Refresh page to show the upload

            setTimeout(() => setStatus('Idle'), 2000);
        }
        catch (error)
        {
            console.error(error);
            setStatus('Error');
        }
    }

    return(
        <div className = "bg-white p-6 rounded-lg border shadow-sm mb-8">
            <h3 className = "font-bold text-lg mb-4">Upload Media</h3>

            <form onSubmit={handleUpload} className = "flex gap-4 items-center">
                <input
                    type="file"
                    onChange={(e) => {
                    if (e.target.files) setFile(e.target.files[0]);
                    }}

                    className="block w-full text-sm text-gray-500
                    file: mr-4 file: py-2 file:px-4
                    file: rounded-full file:border-0
                    file: text-sm file: font-semibold
                    file: bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                    />

                <button
                    type="submit"
                    disabled={!file || status == "Uploading..."}
                    className = "bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >{status == "Uploading..." ? "Uploading..." : "upload"}</button>
            </form>
            {status === "Success" && <p className = "text-green-600 mt-2 text-sm">File uploaded successfully!</p>}
            {status === "Error" && <p className = "text-red-600 mt-2 text-sm">Upload failed.</p>}
        </div>
    )
}