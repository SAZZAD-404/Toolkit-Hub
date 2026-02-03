'use client';

import React, { useState } from 'react';
import { HelpCircle, Search, Book, MessageCircle, Mail, ExternalLink, ChevronDown, ChevronRight, Zap, Image, Video, Mic, FileText, Link2, AtSign } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I start using the AI tools?',
    answer: 'Simply navigate to any tool from the dashboard sidebar, enter your prompt or content, and click generate. Our AI system will automatically handle provider selection and failover.'
  },
  {
    category: 'Getting Started',
    question: 'What AI providers do you support?',
    answer: 'We support multiple AI providers including Cerebras, Google Gemini, Groq, OpenAI, GitHub Models, Stability AI, DEAPI, and ElevenLabs for different types of content generation.'
  },
  {
    category: 'Faceless Video',
    question: 'How long can my faceless videos be?',
    answer: 'You can create videos from 1 to 20 minutes long. Each scene is exactly 8 seconds, so a 20-minute video will have 150 scenes with detailed cinematic descriptions.'
  },
  {
    category: 'Faceless Video',
    question: 'What niches are supported for video generation?',
    answer: 'We support Car Restoration, Monkey Village Cooking, Animal Village Cooking, Historical Mystery, and Animal Rescue niches—each with specialized prompts and visual styles.'
  },
  {
    category: 'AI Image Creator',
    question: 'What image styles can I generate?',
    answer: 'You can generate images in various styles including Realistic, Anime, Digital Art, Oil Painting, Watercolor, Sketch, 3D Render, and Pixel Art.'
  },
  {
    category: 'AI Image Creator',
    question: 'Can I download the generated images?',
    answer: 'Yes, you can download any generated image by clicking the Export button. Images are generated in high quality PNG format.'
  },
  {
    category: 'Text Tools',
    question: 'How accurate is the text summarization?',
    answer: 'Our AI summarization uses advanced language models to capture key points while maintaining context. You can choose between short, medium, and long summary lengths.'
  },
  {
    category: 'Text Tools',
    question: 'Can the prompt redesigner improve any type of prompt?',
    answer: 'Yes, the prompt redesigner can enhance prompts for any AI model or use case, making them more detailed, structured, and effective.'
  },
  {
    category: 'Audio & TTS',
    question: 'What voices are available for text-to-speech?',
    answer: 'We offer multiple high-quality voices through ElevenLabs and DEAPI, including different accents and speaking styles for natural-sounding audio.'
  },
  {
    category: 'Temporary Email',
    question: 'How long do temporary emails last?',
    answer: 'Temporary emails are active as long as you keep the page open. Emails are automatically refreshed every 10 seconds and support attachments up to 50MB.'
  },
  {
    category: 'Technical',
    question: 'What happens if an AI provider fails?',
    answer: 'Our Universal AI Manager automatically switches to the next available provider. We support multiple API keys per provider for maximum reliability.'
  },
  {
    category: 'Technical',
    question: 'Why am I getting rate limit errors?',
    answer: 'Rate limits occur when API quotas are exceeded. Our system automatically rotates between different API keys and providers to minimize this issue.'
  }
];

const tools = [
  { name: 'Faceless Video Generator', icon: Video, description: 'Create cinematic video scripts with detailed scene descriptions' },
  { name: 'AI Image Creator', icon: Image, description: 'Generate high-quality images in various artistic styles' },
  { name: 'Text-to-Speech', icon: Mic, description: 'Convert text to natural-sounding audio with multiple voices' },
  { name: 'Prompt Redesigner', icon: Zap, description: 'Enhance and optimize prompts for better AI results' },
  { name: 'Text Summarizer', icon: FileText, description: 'Summarize long texts into concise, key-point summaries' },
  { name: 'URL Shortener', icon: Link2, description: 'Create short links and track click analytics' },
  { name: 'Temporary Email', icon: AtSign, description: 'Get disposable email addresses for temporary use' }
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="tool-header-icon bg-gradient-to-br from-purple-600 to-violet-900 shadow-purple-500/25">
          <HelpCircle size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Help Center</h1>
          <p className="text-zinc-500 font-medium">Get help and learn how to use our AI tools</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-6 border-white/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Book size={20} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Documentation</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Comprehensive guides and tutorials for all tools</p>
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
            Browse Docs <ExternalLink size={14} />
          </button>
        </div>

        <div className="glass-card rounded-xl p-6 border-white/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <MessageCircle size={20} className="text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">Live Chat</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Get instant help from our support team</p>
          <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1">
            Start Chat <ExternalLink size={14} />
          </button>
        </div>

        <div className="glass-card rounded-xl p-6 border-white/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Mail size={20} className="text-orange-400" />
            </div>
            <h3 className="font-semibold text-white">Email Support</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Send us detailed questions via email</p>
          <button className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1">
            Contact Us <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Tools Overview */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Available Tools</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <div key={tool.name} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <tool.icon size={16} className="text-white" />
                </div>
                <h3 className="font-medium text-white text-sm">{tool.name}</h3>
              </div>
              <p className="text-xs text-zinc-400">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl input-field"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-12 px-4 rounded-xl input-field sm:w-48"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">No FAQs found matching your search.</p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <div key={index} className="border border-white/[0.06] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div>
                    <span className="text-xs text-blue-400 font-medium">{faq.category}</span>
                    <h3 className="text-sm font-medium text-white mt-1">{faq.question}</h3>
                  </div>
                  {expandedFAQ === index ? (
                    <ChevronDown size={18} className="text-zinc-400" />
                  ) : (
                    <ChevronRight size={18} className="text-zinc-400" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div className="px-4 pb-4 border-t border-white/[0.06] bg-white/[0.01]">
                    <p className="text-sm text-zinc-300 leading-relaxed pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Still Need Help?</h2>
        <p className="text-zinc-400 mb-6">
          Can't find what you're looking for? Our support team is here to help you get the most out of our AI tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            <MessageCircle size={18} />
            Start Live Chat
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/[0.06] text-white rounded-xl font-medium hover:bg-white/[0.08] transition-colors">
            <Mail size={18} />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}