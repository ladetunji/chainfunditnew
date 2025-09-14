"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Search,
  Filter,
  Globe,
  Shield,
  Users,
  Stethoscope,
  GraduationCap,
  Home,
  TreePine,
  Music,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Charity data - might need to be put in an API
const charities = [
  {
    id: "1",
    name: "British Heart Foundation",
    category: "Health",
    logo: "/images/bhf.png",
    website: "https://www.bhf.org.uk/",
    verified: true,
  },
  {
    id: "2",
    name: "Cancer Research UK",
    category: "Health",
    logo: "/images/cruk.png",
    website: "https://www.cancerresearchuk.org/",
    verified: true,
  },
  {
    id: "3",
    name: "Save the Children International",
    category: "Children",
    logo: "/images/stc.png",
    website: "https://www.savethechildren.org/",
    verified: true,
  },
  {
    id: "4",
    name: "Macmillan Cancer Support",
    category: "Health",
    logo: "/images/mcp.png",
    website: "https://www.macmillan.org.uk/",
    verified: true,
  },
  {
    id: "5",
    name: "The Salvation Army",
    category: "Community",
    logo: "/images/tsa.png",
    website: "https://secure20.salvationarmy.org",
    verified: true,
  },
  {
    id: "6",
    name: "NSPCC",
    category: "Children",
    logo: "/images/nspcc.png",
    website: "https://www.nspcc.org.uk/",
    verified: true,
  },
  {
    id: "7",
    name: "Global Fund for Children",
    category: "Global",
    logo: "/images/gfc.png",
    website: "https://globalfundforchildren.org/",
    verified: true,
  },
  {
    id: "8",
    name: "Brain Tumour Research",
    category: "Health",
    logo: "/images/btr.png",
    website: "https://braintumourresearch.org/",
    verified: true,
  },
  {
    id: "9",
    name: "The Primary Club",
    category: "Children",
    logo: "/images/tpc.png",
    website: "https://www.primaryclub.org/",
    verified: true,
  },
  {
    id: "10",
    name: "Capokolam",
    category: "Arts",
    logo: "/images/capokolam.png",
    website: "https://www.capokolam.org/",
    verified: true,
  },
  {
    id: "11",
    name: "Seeability",
    category: "Health",
    logo: "/images/seeability.png",
    website: "https://www.seeability.org/",
    verified: true,
  },
  {
    id: "12",
    name: "Drinkaware",
    category: "Health",
    logo: "/images/drinkaware.png",
    website: "https://www.drinkaware.co.uk/",
    verified: true,
  },
  {
    id: "13",
    name: "Movember",
    category: "Health",
    logo: "/images/movember.png",
    website: "https://uk.movember.com/",
    verified: true,
  },
  {
    id: "14",
    name: "Amnesty International",
    category: "Global",
    logo: "/images/ai.png",
    website: "https://www.amnesty.org.uk/",
    verified: true,
  },
  {
    id: "15",
    name: "Scope",
    category: "Community",
    logo: "/images/scope.png",
    website: "https://www.scope.org.uk/",
    verified: true,
  },
  {
    id: "16",
    name: "Practical Action",
    category: "Global",
    logo: "/images/practical-action.png",
    website: "https://practicalaction.org/",
    verified: true,
  },
  {
    id: "17",
    name: "The Blue Cross",
    category: "Community",
    logo: "/images/blue-cross.jpg",
    website: "https://www.bluecross.org.uk/",
    verified: true,
  },
  {
    id: "18",
    name: "Sightsavers",
    category: "Health",
    logo: "/images/sightsavers.png",
    website: "https://www.sightsavers.org/",
    verified: true,
  },
];

const categories = [
  { id: "all", name: "All Categories", icon: Globe },
  { id: "Health", name: "Health", icon: Stethoscope },
  { id: "Children", name: "Children", icon: Users },
  { id: "Education", name: "Education", icon: GraduationCap },
  { id: "Community", name: "Community", icon: Home },
  { id: "Environment", name: "Environment", icon: TreePine },
  { id: "Arts", name: "Arts", icon: Music },
  { id: "Housing", name: "Housing", icon: BookOpen },
  { id: "Global", name: "Global", icon: Globe },
];

export default function VirtualGivingMallPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter charities based on search and category
  const filteredCharities = charities.filter((charity) => {
    const matchesSearch =
      charity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      charity.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || charity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-[#104901] mt-16 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Donate to Your Favourite Charity
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            We've made it easy to simply select your favourite charity and
            support causes close to your heart
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
                  placeholder="Search charities..."
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
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.slice(1).map((category) => {
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-1 items-end">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredCharities.length} Charities Found
            </h2>
            <p className="text-gray-600">
              {selectedCategory !== "all"
                ? `in ${
                    categories.find((c) => c.id === selectedCategory)?.name
                  }`
                : ""}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="grid grid-cols-2 gap-1 w-4 h-4">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex flex-col gap-1 w-4 h-4">
                <div className="bg-current rounded-sm h-1"></div>
                <div className="bg-current rounded-sm h-1"></div>
                <div className="bg-current rounded-sm h-1"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Charities Grid/List */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {filteredCharities.map((charity) => (
            <Card
              key={charity.id}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-0">
                {/* Logo Section */}
                <div
                  className="bg-white h-36 rounded-t-lg flex items-center justify-center relative overflow-hidden bg-contain bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${charity.logo})`,
                  }}
                >
                  {/* Subtle overlay for better badge visibility */}
                  {/* <div className="absolute inset-0 bg-black/10 rounded-t-lg"></div> */}
                  {charity.verified && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-white/90 backdrop-blur-sm text-green-600 border-green-600 shadow-sm">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {charity.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {charity.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                      </span>
                    </div>
                  </div>

                  {/* Donate Button */}
                  <Button
                    // onClick={() => handleDonate(charity)}
                    className="w-full text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
                  >
                    <Link href={charity.website} target="_blank">
                      Donate Now
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCharities.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No charities found
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
      </div>
    </div>
  );
}
