import React, { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

const getCleanToken = () => {
    const rawToken = localStorage.getItem("token");
    return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

function CreateCommentCard({ postId, profilePicture, postOwnerUsername, currentUsername, onCommentCreated }) {
    const [commentText, setCommentText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0] || null;
        setSelectedFile(file);
    };

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl("");
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [selectedFile]);

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setPreviewUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const resetForm = () => {
        setCommentText("");
        removeSelectedFile();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!commentText.trim()) {
            return;
        }

        const token = getCleanToken();
        if (!token) {
            console.error("No authentication token found");
            return;
        }

        const formData = new FormData();
        formData.append("content", commentText.trim());

        if (selectedFile) {
            if (selectedFile.type.startsWith("video/")) {
                formData.append("video", selectedFile);
            } else {
                formData.append("image", selectedFile);
            }
        }

        try {
            setIsSubmitting(true);
            const response = await fetch(`${API_BASE}/api/posts/${postId}/comments/`, {
                method: "POST",
                headers: {
                    Authorization: "Token " + token,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const result = await response.json();
            resetForm();

            if (onCommentCreated) {
                onCommentCreated(result);
            }
        } catch (error) {
            console.error("Failed to create comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex w-full h-auto border border-zinc-800 p-3 bg-zinc-950/50 rounded-lg mt-4">
            <div className="flex flex-col w-full h-auto gap-3">
                {postOwnerUsername && (
                    <div className="text-sm text-zinc-400">
                        Replying to{" "}
                        <a 
                            href={`/profile/${postOwnerUsername}`}
                            className="text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                            @{postOwnerUsername}
                        </a>
                    </div>
                )}
                <div className="flex flex-row w-full h-auto gap-4">
                    <div className="flex w-12 h-12 rounded-full overflow-hidden">
                        <a href={`/profile/${currentUsername}`} className="w-full h-full">
                            <img 
                                src={profilePicture || ""} 
                                alt="Profile Image" 
                                className="w-full h-full object-cover rounded-full cursor-pointer hover:opacity-80 transition" 
                            />
                        </a>
                    </div>
                    <div className="flex-1">
                        <form onSubmit={handleSubmit}>
                            <div className="flex w-full text-zinc-500">
                                <textarea
                                    placeholder="Reply to this post..."
                                    value={commentText}
                                    onChange={(event) => setCommentText(event.target.value)}
                                    className="bg-zinc-900 w-full h-auto text-zinc-300 placeholder:text-zinc-500 focus:outline-none resize-none rounded-lg p-2 border border-zinc-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {selectedFile && previewUrl && (
                                <div className="mt-3 relative rounded-lg overflow-hidden border border-zinc-700">
                                    {selectedFile.type.startsWith("video/") ? (
                                        <video
                                            src={previewUrl}
                                            controls
                                            className="w-full max-h-80 object-cover bg-black"
                                        />
                                    ) : (
                                        <img
                                            src={previewUrl}
                                            alt="Selected preview"
                                            className="w-full max-h-80 object-cover"
                                        />
                                    )}

                                    <button
                                        type="button"
                                        onClick={removeSelectedFile}
                                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-row gap-4 border-t border-zinc-800 pt-3 w-full h-auto mt-3 justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex justify-center items-center p-2 rounded-full hover:bg-zinc-800 transition duration-300 text-zinc-400 hover:text-zinc-200"
                                >
                                    <ImagePlus className="w-5 h-5" />
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {selectedFile && (
                                    <span className="text-xs text-zinc-400">{selectedFile.name}</span>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !commentText.trim()}
                                    className="flex bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Replying..." : "Reply"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateCommentCard;
