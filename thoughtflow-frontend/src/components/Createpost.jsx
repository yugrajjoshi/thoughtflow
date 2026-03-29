import React, { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

function CreatePost({ profilePicture, onPostCreated }) {
  const [postText, setPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0] || null;
    setSelectedFile(file);
  };

  const resetForm = () => {
    setPostText("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!postText.trim()) {
      return;
    }

    const rawToken = localStorage.getItem("token");
    const token = rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
    const formData = new FormData();
    formData.append("content", postText.trim());

    if (selectedFile) {
      if (selectedFile.type.startsWith("video/")) {
        formData.append("video", selectedFile);
      } else {
        formData.append("image", selectedFile);
      }
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("http://127.0.0.1:8000/api/posts/", {
        method: "POST",
        headers: {
          Authorization: "Token " + token,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const createdPost = await response.json();
      resetForm();

      if (onPostCreated) {
        onPostCreated(createdPost);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full h-auto border border-zinc-900 p-3">
      <div className="flex flex-col w-full h-auto gap-3">
        <div className="flex flex-row w-full h-auto gap-4">
          <div className="flex w-15 h-15 rounded-full">
            <img src={profilePicture || ""} alt="Profile Image" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <div className="flex w-full text-zinc-500">
                <textarea
                  placeholder="What's happening?"
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  className="bg-black w-full h-auto text-zinc-300 placeholder:text-2xl placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-row gap-4 border-t pt-2 border-zinc-900 w-full h-auto mt-2 justify-between items-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex justify-center items-center p-2 rounded-full hover:bg-zinc-600 transition duration-300"
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
                {selectedFile && <span className="text-xs text-zinc-400">{selectedFile.name}</span>}
                <button
                  type="submit"
                  disabled={isSubmitting || !postText.trim()}
                  className="flex bg-green-900 text-white px-4 py-2 rounded-full hover:bg-green-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Posting..." : "+ Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;