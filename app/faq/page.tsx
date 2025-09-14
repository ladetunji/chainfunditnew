"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Users,
  Heart,
} from "lucide-react";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
} from "@/components/ui/select";

// FAQ data - you can replace this with your actual content later
const faqCategories = [
  { id: "general", name: "General", icon: HelpCircle },
  { id: "donations", name: "Donations", icon: Heart },
  { id: "campaigns", name: "Campaigns", icon: Users },
  { id: "account", name: "Account", icon: MessageCircle },
];

const faqData = [
  {
    id: 1,
    category: "general",
    question: "What is ChainFundIt?",
    answer:
      "ChainFundIt is a crowdfunding platform that connects donors with meaningful causes. We make it easy to discover, support, and share campaigns that matter to you.",
  },
  {
    id: 2,
    category: "general",
    question: "How does the platform work?",
    answer:
      'Users can create campaigns, donate to existing ones, or "chain" campaigns by sharing them with their network. Our platform facilitates secure transactions and transparent fundraising.',
  },
  {
    id: 3,
    category: "donations",
    question: "How do I make a donation?",
    answer:
      "Simply browse campaigns, select one you want to support, and click the donate button. You can donate using various payment methods including credit cards, bank transfers, and digital wallets.",
  },
  {
    id: 4,
    category: "donations",
    question: "Are donations secure?",
    answer:
      "Yes, we use industry-standard encryption and work with trusted payment processors to ensure all transactions are secure and your financial information is protected.",
  },
  {
    id: 5,
    category: "campaigns",
    question: "How do I create a campaign?",
    answer:
      'Click the "Create Campaign" button, fill in your campaign details, upload images, set your funding goal, and submit for review. Once approved, your campaign will go live.',
  },
  {
    id: 6,
    category: "campaigns",
    question: "What fees do you charge?",
    answer:
      "We charge a small platform fee to cover payment processing and operational costs. The exact fee structure is transparent and displayed before you create or donate to campaigns.",
  },
  {
    id: 7,
    category: "account",
    question: "How do I update my profile?",
    answer:
      'Go to your dashboard, click on "Settings" or "Profile", and update your information. You can change your display name, profile picture, and contact preferences.',
  },
  {
    id: 8,
    category: "account",
    question: "Can I delete my account?",
    answer:
      "Yes, you can delete your account from the settings page. Please note that this action is irreversible and will remove all your campaign and donation history.",
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openItems, setOpenItems] = useState<number[]>([]);

  // Filter FAQs based on search and category
  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const categories = [{ id: "all", name: "All Categories" }, ...faqCategories];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-[#104901] mt-16 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Find answers to common questions about ChainFundIt
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#E7EDE6]">
                  <SelectGroup>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="flex items-center font-normal text-2xl text-[#5F8555]"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6 flex gap-1 items-end">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredFAQs.length} Questions Found
          </h2>
          <p className="text-gray-600 text-base">
            {selectedCategory !== "all"
              ? `in ${
                  faqCategories.find((c) => c.id === selectedCategory)?.name
                }`
              : ""}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq) => {
            const isOpen = openItems.includes(faq.id);
            const categoryInfo = faqCategories.find(
              (c) => c.id === faq.category
            );
            const Icon = categoryInfo?.icon || HelpCircle;

            return (
              <Card
                key={faq.id}
                className="hover:shadow-lg transition-all duration-200"
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Icon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {faq.question}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {categoryInfo?.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4">
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredFAQs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No questions found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search criteria or browse all categories
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to
              help you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Get help via email</p>
              <Button
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
              >
                support@chainfundit.com
              </Button>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Phone Support</h3>
              <p className="text-gray-600 mb-4">Speak with our team</p>
              <Button
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
              >
                +1 (555) 123-4567
              </Button>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Chat with us online</p>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
