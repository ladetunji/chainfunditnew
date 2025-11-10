import React, { useRef, useState, useEffect } from "react";
import { ArrowUp, UserCheck } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedinIn, FaTiktok, FaTwitter, FaYoutube } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {};

const Account = (props: Props) => {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    twitter: "",
    tiktok: "",
    youtube: "",
    avatar: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    fetch("/api/user/profile", { method: "GET" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        if (!text) {
          throw new Error("Empty response from server");
        }
        return JSON.parse(text);
      })
      .then(data => {
        if (data.success && data.user) {
          setForm({
            fullName: data.user.fullName || "",
            bio: data.user.bio || "",
            instagram: data.user.instagram || "",
            facebook: data.user.facebook || "",
            linkedin: data.user.linkedin || "",
            twitter: data.user.twitter || "",
            tiktok: data.user.tiktok || "",
            youtube: data.user.youtube || "",
            avatar: data.user.avatar || "",
          });
          setPreview(data.user.avatar || null);
        }
      })
      .catch((error) => {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load profile");
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setForm(f => ({ ...f, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" 2xl:container 2xl:mx-auto">
      <h4 className="font-semibold text-2xl md:text-3xl text-[#104901]">Your profile</h4>
      <p className="font-normal text-base md:text-xl text-[#104901]">
        Choose how you are displayed on the website.
      </p>

      <form className="mt-8" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-5 md:gap-10">
          <section className="flex flex-col">
            <label className="font-normal text-base md:text-xl text-[#104901] mb-2">
              Name
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full md:w-[385px] py-[10px] mb-3 px-5 rounded-lg border border-[#D9D9DC] outline-none placeholder:font-medium placeholder:text-lg md:placeholder:text-2xl placeholder:text-[#1E1E1E]"
            />
            <label className="font-normal text-base md:text-xl text-[#104901] mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Share a little about your background and interests"
              className="w-full md:w-[385px] py-[10px] mb-3 px-5 rounded-lg border border-[#D9D9DC] outline-none placeholder:font-medium placeholder:text-sm placeholder:text-[#ADADAD]"
            />
          </section>
          <div className="relative">
            <p className="font-medium text-base md:text-xl text-black mb-4">Profile picture</p>
            <input
              type="file"
              id="profile-image-upload"
              accept="image/*"
              className="hidden"
              ref={inputRef}
              onChange={handleFileChange}
            />
            <label
              htmlFor="profile-image-upload"
              className="w-[80px] md:w-[100px] h-[80px] md:h-[100px] rounded-full flex items-center justify-center cursor-pointer bg-center bg-cover border-2 border-white mx-auto md:mx-0"
              style={{
                backgroundImage: preview
                  ? `url(${preview})`
                  : ``,
              }}
              title="Upload profile image"
            >
              {!preview && (
                <span className="sr-only">Upload profile image</span>
              )}
            </label>
            <section className="w-6 md:w-[33px] h-6 md:h-[33px] bg-[#104901] rounded-full flex items-center justify-center text-white absolute left-1/2 md:left-16 transform -translate-x-1/2 md:transform-none md:bottom-20 bottom-0">
              <ArrowUp size={12} className="md:w-3 md:h-3" />
            </section>
          </div>
        </div>
        <p className="font-normal text-base md:text-xl text-[#104901] mt-3">Social links</p>
        <div className="flex flex-col lg:flex-row gap-5">
          <ul className="flex flex-col gap-2 flex-1">
            <li className="flex gap-3 items-center">
              <FaInstagram size={36} />
              <section className="bg-[#D9D9D9] w-fit flex gap-2 items-center pl-5 pr-1 py-1 rounded-lg flex-1 md:flex-none">
                <span className="font-medium text-sm md:text-xl text-[#2C2C2C]">instagram.com/</span>
                <input
                  type="text"
                  name="instagram"
                  value={form.instagram}
                  onChange={handleChange}
                  placeholder="username"
                  className="w-full md:w-[145px] rounded-[6px] px-3 py-2 outline-none placeholder:font-medium placeholder:text-sm md:placeholder:text-xl placeholder:text-[#ADADAD]"
                />
              </section>
            </li>
            <li className="flex gap-3 items-center">
              <FaFacebook size={36} />
              <section className="bg-[#D9D9D9] w-fit flex gap-2 items-center pl-5 pr-1 py-1 rounded-lg flex-1 md:flex-none">
                <span className="font-medium text-sm md:text-xl text-[#2C2C2C]">facebook.com/</span>
                <input
                  type="text"
                  name="facebook"
                  value={form.facebook}
                  onChange={handleChange}
                  placeholder="username"
                  className="w-full md:w-[145px] rounded-[6px] px-3 py-2 outline-none placeholder:font-medium placeholder:text-sm md:placeholder:text-xl placeholder:text-[#ADADAD]"
                />
              </section>
            </li>
            <li className="flex gap-3 items-center">
              <FaLinkedinIn size={36} />
              <section className="bg-[#D9D9D9] w-fit flex gap-2 items-center pl-5 pr-1 py-1 rounded-lg flex-1 md:flex-none">
                <span className="font-medium text-sm md:text-xl text-[#2C2C2C]">linkedin.com/</span>
                <input
                  type="text"
                  name="linkedin"
                  value={form.linkedin}
                  onChange={handleChange}
                  placeholder="in/username"
                  className="w-full md:w-[145px] rounded-[6px] px-3 py-2 outline-none placeholder:font-medium placeholder:text-sm md:placeholder:text-xl placeholder:text-[#ADADAD]"
                />
              </section>
            </li>
          </ul>
          <ul className="flex flex-col gap-2 flex-1">
            <li className="flex gap-3 items-center">
              <FaTwitter size={36} />
              <section className="bg-[#D9D9D9] w-fit flex gap-2 items-center pl-5 pr-1 py-1 rounded-lg flex-1 md:flex-none">
                <span className="font-medium text-sm md:text-xl text-[#2C2C2C]">x.com/</span>
                <input
                  type="text"
                  name="twitter"
                  value={form.twitter}
                  onChange={handleChange}
                  placeholder="username"
                  className="w-full md:w-[145px] rounded-[6px] px-3 py-2 outline-none placeholder:font-medium placeholder:text-sm md:placeholder:text-xl placeholder:text-[#ADADAD]"
                />
              </section>
            </li>
            <li className="flex gap-3 items-center">
              <FaTiktok size={36} />
              <section className="bg-[#D9D9D9] w-fit flex gap-2 items-center pl-5 pr-1 py-1 rounded-lg flex-1 md:flex-none">
                <span className="font-medium text-sm md:text-xl text-[#2C2C2C]">tiktok.com/@</span>
                <input
                  type="text"
                  name="tiktok"
                  value={form.tiktok}
                  onChange={handleChange}
                  placeholder="username"
                  className="w-full md:w-[145px] rounded-[6px] px-3 py-2 outline-none placeholder:font-medium placeholder:text-sm md:placeholder:text-xl placeholder:text-[#ADADAD]"
                />
              </section>
            </li>
            <li className="flex gap-3 items-center">
              <FaYoutube size={36} />
              <section className="bg-[#D9D9D9] w-fit flex gap-2 items-center pl-5 pr-1 py-1 rounded-lg flex-1 md:flex-none">
                <span className="font-medium text-sm md:text-xl text-[#2C2C2C]">youtube.com/@</span>
                <input
                  type="text"
                  name="youtube"
                  value={form.youtube}
                  onChange={handleChange}
                  placeholder="username"
                  className="w-full md:w-[145px] rounded-[6px] px-3 py-2 outline-none placeholder:font-medium placeholder:text-sm md:placeholder:text-xl placeholder:text-[#ADADAD]"
                />
              </section>
            </li>
          </ul>
        </div>
        <Button
          className="w-full md:w-[240px] my-7 font-semibold text-lg md:text-2xl flex justify-between h-12 md:h-14"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save changes"} <UserCheck />
        </Button>
      </form>
    </div>
  );
};

export default Account;
