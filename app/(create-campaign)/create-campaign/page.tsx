"use client";
import React, { useRef, useState, ChangeEvent } from "react";
import Image from "next/image";
import {
  Activity,
  Airplay,
  AlertTriangle,
  Ambulance,
  Archive,
  BookOpen,
  Cat,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  Droplet,
  Euro,
  Feather,
  Flag,
  Frown,
  Gift,
  Globe,
  HeartHandshake,
  Lock,
  MinusCircle,
  Paperclip,
  PenTool,
  Plus,
  PlusSquare,
  PoundSterling,
  ShoppingCart,
  Target,
  User,
  UserPlus,
  Users,
  Youtube,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LuImage } from "react-icons/lu";

const reasons = [
  { text: "Business", icon: <ShoppingCart /> },
  { text: "Charity", icon: <Gift /> },
  { text: "Community", icon: <Users /> },
  { text: "Creative", icon: <Feather /> },
  { text: "Education", icon: <BookOpen /> },
  { text: "Emergency", icon: <Activity /> },
  { text: "Religion", icon: <Plus /> },
  { text: "Family", icon: <HeartHandshake /> },
  { text: "Medical", icon: <PlusSquare /> },
  { text: "Memorial", icon: <Frown /> },
  { text: "Pets", icon: <Cat /> },
  { text: "Sports", icon: <Flag /> },
  { text: "Uncategorized", icon: <AlertTriangle /> },
  { text: "Welfare", icon: <Ambulance /> },
];

const persons = [
  { text: "Yourself", icon: <User /> },
  { text: "Someone else", icon: <UserPlus /> },
  { text: "Charity", icon: <Gift /> },
];

const currencies = [
  { text: "British Pound", icon: <PoundSterling /> },
  { text: "US Dollar", icon: <DollarSign /> },
  { text: "Nigerian Naira", icon: "₦" },
  { text: "Euro", icon: <Euro /> },
  { text: "Canadian Dollar", icon: "C$" },
];

const duration = [
  { text: "Not applicable", icon: <MinusCircle /> },
  { text: "1 week" },
  { text: "2 weeks" },
  { text: "1 month" },
  { text: "1 year" },
];

type CampaignFormData = {
  title: string;
  subtitle: string;
  visibility: "public" | "private";
  reason: string;
  fundraisingFor: string;
  currency: string;
  goal: string;
  duration: string;
  video: string;
  documents: File[];
  images: File[];
  coverImage: File | null;
  story: string;
};

export default function CreateCampaignPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState<CampaignFormData>({
    title: "",
    subtitle: "",
    visibility: "public",
    reason: "",
    fundraisingFor: "",
    currency: "",
    goal: "",
    duration: "",
    video: "",
    documents: [],
    images: [],
    coverImage: null,
    story: "",
  });

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, coverImage: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFieldChange = (field: keyof CampaignFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectFile = (
    field: "images" | "documents",
    files: FileList | null
  ) => {
    if (!files) return;
    setFormData((prev) => ({
      ...prev,
      [field]: Array.from(files),
    }));
  };

  const handleSuggestStory = async () => {
    const exampleSuggestions = [
      "I'm raising funds to support a vital cause that's close to my heart...",
      "Help me make a difference in my community through this fundraiser...",
      "Your contribution will help us achieve a life-changing goal for someone in need...",
    ];

    setSuggestions(exampleSuggestions);
    setShowSuggestions(true);
  };

  const handleSubmit = async () => {
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images" || key === "documents") {
        (value as File[]).forEach((file) => payload.append(key, file));
      } else if (key === "coverImage" && value) {
        payload.append("coverImage", value as File);
      } else {
        payload.append(key, value as string);
      }
    });

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        body: payload,
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      const data = await res.json();
      console.log("Success:", data);
    } catch (err) {
      console.error(err);
    }
  };

  const isFinalStep = step === 4;
  const nextStep = () => {
    if (isFinalStep) {
      handleSubmit();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full h-full font-source">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        {/* Step 1 */}
        {step === 1 && (
          <div className="w-full flex md:flex-row flex-col gap-5 md:gap-10">
            {/* Left Side: Image Upload */}
            <div className="w-full md:w-2/5">
              <div className="relative">
                <input
                  type="file"
                  id="profile-image-upload"
                  accept="image/*"
                  className="hidden"
                  ref={inputRef}
                  onChange={handleImageChange}
                />
                <label
                  htmlFor="profile-image-upload"
                  className="w-[200px] md:w-[360px] h-[200px] md:h-[360px] flex items-center justify-center cursor-pointer bg-center bg-cover"
                  style={{
                    backgroundImage: preview
                      ? `url(${preview})`
                      : `url('/images/image.png')`,
                  }}
                  title="Upload profile image"
                >
                  {!preview && (
                    <span className="sr-only">Upload profile image</span>
                  )}
                </label>
                <section className="w-8 md:w-[56px] h-8 md:h-[56px] bg-[#104901] flex items-center justify-center text-white absolute right-[118px] md:right-[160px] bottom-6 md:bottom-11">
                  <Plus className="md:text-4xl text-lg" size={36} />
                </section>
              </div>
              <p className="font-medium text-sm md:text-xl text-[#104901]">
                Upload your main campaign image
              </p>
            </div>

            <div className="md:w-3/5 w-full flex flex-col gap-3">
              {/* Campaign Title */}
              <p className="font-semibold text-3xl text-[#104901]">
                Campaign details
              </p>
              <section className="flex flex-col gap-1">
                <input
                  type="text"
                  placeholder="Campaign title"
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className="w-full bg-transparent outline-none text-base md:text-[56px] placeholder:font-semibold placeholder:text-lg md:placeholder:text-[56px] placeholder:text-[#B3B3B3]"
                />
                <span className="font-normal text-base text-[#ADADAD]">
                  What is the title of your fundraising campaign?
                </span>
              </section>

              {/* Add Subtitle */}
              <div className="bg-[#E5ECDE] flex gap-2 w-full py-3 px-4 rounded-xl">
                <Droplet color="#5F8555" size={32} />
                <section>
                  <input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      handleFieldChange("subtitle", e.target.value)
                    }
                    placeholder="Add subtitle (optional)"
                    className="w-full bg-transparent font-medium text-lg md:text-3xl text-[#5F8555] placeholder:text-[#5F8555] outline-none"
                  />
                  <p className="font-normal text-xs md:text-base text-[#5F8555]">
                    A catchy, emotional hook to attract donors to your campaign
                    (150 characters max)
                  </p>
                </section>
              </div>

              {/* Visibility */}
              <div className="flex gap-5">
                <label className="block font-medium text-3xl text-[#104901]">
                  Visibility
                </label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) =>
                    handleFieldChange(
                      "visibility",
                      value as "public" | "private"
                    )
                  }
                >
                  <SelectTrigger className="w-[150px] bg-[#E5ECDE] border-0 shadow-none text-[#5F8555]">
                    <SelectValue placeholder="Public" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#E7EDE6]">
                    <SelectGroup>
                      <SelectItem
                        value="public"
                        className="flex items-center font-normal text-2xl text-[#5F8555]"
                      >
                        <section className="flex items-center gap-2">
                          <Globe />
                          Public
                        </section>
                      </SelectItem>
                      <SelectItem
                        value="private"
                        className="flex gap-2 items-center font-normal text-2xl text-[#5F8555]"
                      >
                        <section className="flex items-center gap-2">
                          <Archive />
                          Private
                        </section>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason for Fundraising */}
              <div>
                <label className="block font-medium text-[28px] text-[#104901] mb-2">
                  Reason for fundraising
                </label>
                <div className="flex flex-wrap gap-2">
                  {reasons.map((reason) => (
                    <button
                      key={reason.text}
                      type="button"
                      onClick={() => handleFieldChange("reason", reason.text)}
                      className={`px-4 py-3 flex gap-2 items-center rounded-xl text-2xl text-[#5F8555] bg-[#E5ECDE] cursor-pointer ${
                        formData.reason === reason.text
                          ? "ring-2 ring-[#5F8555]"
                          : ""
                      }`}
                    >
                      {reason.icon}
                      {reason.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fundraising For */}
              <div>
                <label className="block font-medium text-[28px] text-[#104901] mb-1">
                  Who are you fundraising for?
                  <span className="text-[#FF0404]">*</span>
                </label>
                <div className="flex gap-4 md:flex-row flex-col">
                  {persons.map((person) => (
                    <button
                      key={person.text}
                      type="button"
                      onClick={() =>
                        handleFieldChange("fundraisingFor", person.text)
                      }
                      className={`px-4 py-3 flex gap-2 items-center rounded-xl text-2xl text-[#5F8555] bg-[#E5ECDE] cursor-pointer ${
                        formData.fundraisingFor === person.text
                          ? "ring-2 ring-[#5F8555]"
                          : ""
                      }`}
                    >
                      {person.icon}
                      {person.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="mb-4 font-semibold text-3xl text-[#104901]">
              Fundraising
            </p>

            <section>
              <p className="mb-4 flex gap-3 items-end font-semibold text-[28px] text-[#104901]">
                Currency
                <span className="font-normal text-base text-[#5F8555]">
                  Please select your campaign currency
                </span>
              </p>
              <div className="flex gap-4 md:flex-row flex-col">
                {currencies.map((currency) => (
                  <button
                    key={currency.text}
                    type="button"
                    onClick={() => handleFieldChange("currency", currency.text)}
                    className={`px-4 py-3 flex gap-2 items-center rounded-xl text-2xl text-[#5F8555] bg-[#E5ECDE] cursor-pointer ${
                      formData.currency === currency.text
                        ? "ring-2 ring-[#5F8555]"
                        : ""
                    }`}
                  >
                    {currency.icon} {currency.text}
                  </button>
                ))}
              </div>
            </section>

            <div className="bg-[#E5ECDE] flex gap-2 w-full py-3 px-4 rounded-xl">
              <Target color="#5F8555" size={32} />
              <section>
                <input
                  type="text"
                  id="goal"
                  name="goal"
                  placeholder="Your goal"
                  value={formData.goal}
                  onChange={(e) => handleFieldChange("goal", e.target.value)}
                  className="w-full bg-transparent font-medium text-lg md:text-3xl text-[#5F8555] placeholder:text-[#5F8555] outline-none"
                />
                <p className="font-normal text-xs md:text-base text-[#5F8555]">
                  Please enter target amount
                </p>
              </section>
            </div>

            <section>
              <p className="mb-4 font-semibold text-[28px] text-[#104901]">
                Campaign duration
              </p>
              <div className="flex gap-4 md:flex-row flex-col">
                {duration.map((time) => (
                  <button
                    key={time.text}
                    type="button"
                    onClick={() => handleFieldChange("duration", time.text)}
                    className={`px-4 py-3 flex gap-2 items-center rounded-xl text-2xl text-[#5F8555] bg-[#E5ECDE] cursor-pointer ${
                      formData.duration === time.text
                        ? "ring-2 ring-[#5F8555]"
                        : ""
                    }`}
                  >
                    {time.icon} {time.text}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="mb-4 font-semibold text-[28px] text-[#104901]">
              Media
            </p>
            <div className="bg-[#E5ECDE] flex gap-2 w-full py-3 px-4 rounded-xl">
              <Youtube color="#5F8555" size={32} />
              <section>
                <input
                  type="text"
                  id="video"
                  name="video"
                  value={formData.video}
                  onChange={(e) => handleFieldChange("video", e.target.value)}
                  placeholder="Cover video"
                  className="w-full bg-transparent font-medium text-lg md:text-3xl text-[#5F8555] placeholder:text-[#5F8555] outline-none"
                />
                <p className="font-normal text-xs md:text-base text-[#5F8555]">
                  Copy video link from YouTube or any other valid source and
                  paste here
                </p>
              </section>
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-medium text-2xl text-[#104901] flex gap-2 items-end">
                Documents
                <span className="font-normal text-base text-[#5F8555]">
                  Add additional images to your campaign gallery
                </span>
              </p>
              <p className="font-normal text-lg text-[#5F8555]">
                Up to 5 images, PNG, JPG or WEBP, max 1MB each
              </p>

              <div className="grid md:grid-cols-3 grid-cols-1 gap-4 my-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="campaign-images"
                  onChange={(e) => handleSelectFile("images", e.target.files)}
                />

                <label
                  htmlFor="campaign-images"
                  className="bg-[#E5ECDE] flex gap-3 items-center px-8 py-4 rounded-2xl text-xl text-[#5F8555] cursor-pointer col-span-1"
                >
                  <LuImage size={32} />
                  Choose image
                </label>

                {/* Preview selected images */}
                {formData.images.length > 0 ? (
                  formData.images.map((file, index) => (
                    <div
                      key={index}
                      className="bg-[#E5ECDE] rounded-2xl overflow-hidden flex items-center justify-center"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        className="object-cover w-full h-[120px]"
                      />
                    </div>
                  ))
                ) : (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <section
                        key={index}
                        className="bg-[#E5ECDE] flex gap-3 items-center px-8 py-4 rounded-2xl text-xl text-[#5F8555]"
                      >
                        <LuImage size={32} />
                        Choose image
                      </section>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-medium text-2xl text-[#104901] flex gap-2 items-end">
                More photos
                <span className="font-normal text-base text-[#5F8555]">
                  Add supporting documents
                </span>
              </p>
              <p className="font-normal text-lg text-[#5F8555]">
                PDF, DOC, or DOCX, max 10MB total
              </p>

              <div className="grid md:grid-cols-3 grid-cols-1 gap-4 my-2">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  className="hidden"
                  id="supporting-documents"
                  onChange={(e) =>
                    handleSelectFile("documents", e.target.files)
                  }
                />

                <label
                  htmlFor="supporting-documents"
                  className="bg-[#E5ECDE] flex gap-3 items-center px-8 py-4 rounded-2xl text-xl text-[#5F8555] cursor-pointer col-span-1"
                >
                  <Paperclip size={32} />
                  Choose file
                </label>

                {/* Preview selected documents */}
                {formData.documents.length > 0 ? (
                  formData.documents.map((file, index) => (
                    <div
                      key={index}
                      className="bg-[#E5ECDE] px-4 py-3 rounded-2xl flex items-center gap-2 text-[#5F8555] text-sm"
                    >
                      <Paperclip size={20} />
                      {file.name.length > 30
                        ? file.name.slice(0, 30) + "..."
                        : file.name}
                    </div>
                  ))
                ) : (
                  <>
                    {[...Array(2)].map((_, index) => (
                      <section
                        key={index}
                        className="bg-[#E5ECDE] flex gap-3 items-center px-8 py-4 rounded-2xl text-xl text-[#5F8555]"
                      >
                        <Paperclip size={32} />
                        Choose file
                      </section>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-6">
            <p className="mb-4 font-semibold text-[28px] text-[#104901]">
              Campaign story
            </p>

            <div className="bg-[#E5ECDE] w-full h-[300px] rounded-xl pt-3 relative">
              <div className="flex gap-3 px-4">
                <PenTool size={32} color="#5F8555" className="rotate-180" />
                <section className="flex flex-col gap-2">
                  <textarea
                    placeholder="Add description"
                    value={formData.story}
                    onChange={(e) => handleFieldChange("story", e.target.value)}
                    className="bg-transparent md:w-[1000px] w-full h-10 font-medium text-[28xl] text-[#5F8555] placeholder:font-medium placeholder:text-[28xl] placeholder:text-[#5F8555] outline-none"
                  ></textarea>

                  <span className="font-normal text-base text-[#5F8555]">
                    Tell the world what your campaign is about and why you think
                    they should support you
                  </span>
                </section>
              </div>
              <button
                onClick={handleSuggestStory}
                className="absolute bottom-0 w-full bg-[#5F8555] py-3 px-4 flex gap-2 items-center font-normal text-xl text-[#D9D9D9] rounded-b-xl"
              >
                <Airplay />
                <p>Suggest with AI</p>
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="font-semibold text-[#104901] text-lg">
                  Suggested stories:
                </p>
                {suggestions.map((s, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      handleFieldChange("story", s);
                      setShowSuggestions(false);
                    }}
                    className="cursor-pointer bg-[#F0F5EB] p-4 rounded-lg text-[#5F8555] hover:bg-[#E5ECDE]"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          {step > 1 ? (
            <Button
              type="button"
              className="bg-[#104901] flex justify-between items-center font-semibold text-2xl px-6 py-3 h-14 hover:bg-transparent"
              onClick={() => setStep((prev) => prev - 1)}
            >
              <ChevronsLeft />
              Previous
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            onClick={nextStep}
            className="bg-[#104901] flex justify-between items-center font-semibold text-2xl px-6 py-3 h-14 hover:bg-transparent"
          >
            {isFinalStep ? "Submit" : "Next"} <ChevronsRight />
          </Button>
        </div>
      </form>
    </div>
  );
}
