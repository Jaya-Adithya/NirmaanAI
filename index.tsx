import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { jsPDF } from "jspdf";
import {
  Mic,
  StopCircle,
  CheckCircle2,
  MapPin,
  IndianRupee,
  ScrollText,
  MessageSquare,
  ArrowRight,
  Loader2,
  Download,
  ShieldAlert,
  RefreshCw,
  Sparkles,
  Send,
  Languages,
  Image as ImageIcon,
  Search,
  Globe,
  TrendingUp,
  Store,
  AlertCircle,
  Truck,
  Zap,
  Landmark,
  Calculator,
  Lightbulb,
  FileText,
  ExternalLink,
  Clock,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  Play,
  Copy,
  Check,
  Volume2,
  Plus,
  X,
  Map,
  BarChart3,
  Building2,
  Star,
  ChevronDown,
  ChevronUp,
  LocateFixed
} from "lucide-react";

// --- Types & Interfaces ---

interface VendorScript {
  context: string;
  script: string;
  tone?: string;
}

interface MarketInsights {
  opportunities: string[];
  seasonal_trends: string[];
  underserved_niches: string[];
  competitor_pricing: string;
  rental_costs: string;
  supply_chain_options: string[];
  utility_costs: string;
  govt_subsidies: string[];
}

interface RegulatoryDetail {
    name: string;
    step_by_step: string;
    estimated_cost: string;
    processing_time: string; 
    documents_required: string[]; 
    learn_more_url: string;
    local_authority_details?: string; // NEW: Specific local body info
}

interface MonthlyProjection {
    month: number;
    revenue: number;
    expense: number;
    profit: number;
}

interface FinancialBreakdown {
    fixed_costs_monthly: string[];
    variable_costs_per_unit: string;
    profit_margin_per_unit: string;
    break_even_analysis: string;
    break_even_learn_more_url?: string;
    financial_projections_year_1: MonthlyProjection[]; // NEW: Cash flow
}

interface BusinessPlan {
  idea_summary: string;
  target_location: string;
  budget_estimate: {
    min: number;
    max: number;
    currency: string;
  };
  business_plan: {
    products: string[];
    target_customers: string;
    timing: string;
  };
  market_insights: MarketInsights;
  financial_breakdown: FinancialBreakdown; 
  marketing_strategy: string[]; 
  setup_checklist: string[];
  legal_requirements: RegulatoryDetail[]; 
  vendor_scripts: VendorScript[];
  estimated_daily_profit: string;
  optimization_suggestions: string[];
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  feedback?: 'up' | 'down'; 
}

interface AnalysisResult {
  is_sufficient: boolean;
  clarification_question?: string;
  search_query?: string;
  identified_location?: string;
  identified_business?: string;
  detected_language?: string;
}

interface PlaceResult {
    name: string;
    address: string;
    rating: string;
}

// --- Gemini Configuration ---

// Schema for the structured output
const planSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    idea_summary: { type: Type.STRING, description: "A concise, catchy summary of the business idea" },
    target_location: { type: Type.STRING, description: "The city or region in India" },
    budget_estimate: {
      type: Type.OBJECT,
      properties: {
        min: { type: Type.NUMBER },
        max: { type: Type.NUMBER },
        currency: { type: Type.STRING, description: "Currency symbol, usually INR or ₹" },
      },
      required: ["min", "max", "currency"],
    },
    business_plan: {
      type: Type.OBJECT,
      properties: {
        products: { type: Type.ARRAY, items: { type: Type.STRING } },
        target_customers: { type: Type.STRING },
        timing: { type: Type.STRING, description: "Operating hours" },
      },
      required: ["products", "target_customers", "timing"],
    },
    market_insights: {
      type: Type.OBJECT,
      description: "Specific local market intelligence based on the location.",
      properties: {
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Unique local market opportunities" },
        seasonal_trends: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Seasonal trends relevant to this business in this location" },
        underserved_niches: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Underserved niches in the area" },
        competitor_pricing: { type: Type.STRING, description: "Average pricing of competitors in the area (e.g., 'Tea sells for ₹10-15')" },
        rental_costs: { type: Type.STRING, description: "Real estimated rental costs for a small space/cart in this specific area" },
        supply_chain_options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Where to get raw materials locally (markets, wholesale areas)" },
        utility_costs: { type: Type.STRING, description: "Average monthly electricity/water costs for this business type in this area" },
        govt_subsidies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant government schemes (e.g., PM SVANidhi, Mudra Loan)" },
      },
      required: ["opportunities", "seasonal_trends", "underserved_niches", "competitor_pricing", "rental_costs", "supply_chain_options", "utility_costs", "govt_subsidies"],
    },
    financial_breakdown: {
        type: Type.OBJECT,
        description: "Deep dive into the math of the business",
        properties: {
            fixed_costs_monthly: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of fixed monthly costs (Rent, Salaries, Electricity)"},
            variable_costs_per_unit: { type: Type.STRING, description: "Cost to make one unit (e.g., One plate of idli costs ₹12 to make)"},
            profit_margin_per_unit: { type: Type.STRING, description: "Margin per unit in % or ₹"},
            break_even_analysis: { type: Type.STRING, description: "How many units need to be sold daily to cover costs? (e.g., 'Sell 40 plates/day to break even')"},
            break_even_learn_more_url: { type: Type.STRING, description: "A URL to a resource explaining break-even analysis or small business finance." },
            financial_projections_year_1: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        month: { type: Type.NUMBER },
                        revenue: { type: Type.NUMBER },
                        expense: { type: Type.NUMBER },
                        profit: { type: Type.NUMBER }
                    }
                },
                description: "Projected monthly financials for the first year. Be realistic about slow start."
            }
        },
        required: ["fixed_costs_monthly", "variable_costs_per_unit", "profit_margin_per_unit", "break_even_analysis", "financial_projections_year_1"]
    },
    marketing_strategy: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Specific growth tactics (e.g. WhatsApp list, Subscription model, Instagram aesthetic)"
    },
    setup_checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
    legal_requirements: { 
        type: Type.ARRAY, 
        items: { 
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Name of License (FSSAI, Shop Act)"},
                step_by_step: { type: Type.STRING, description: "How to apply, where to go, documents needed"},
                estimated_cost: { type: Type.STRING, description: "Official fee + Agent fee estimate"},
                processing_time: { type: Type.STRING, description: "Estimated time to get the license (e.g. '3-5 working days')"},
                documents_required: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific documents (Aadhar, Pan, Rental Agreement)"},
                learn_more_url: { type: Type.STRING, description: "Official government website URL for this license"},
                local_authority_details: { type: Type.STRING, description: "Specific local municipal body name and their specific rules (e.g. 'BBMP Trade License section')."}
            },
            required: ["name", "step_by_step", "estimated_cost", "processing_time", "documents_required", "learn_more_url", "local_authority_details"]
        }, 
        description: "Detailed legal roadmap"
    },
    vendor_scripts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          context: { type: Type.STRING, description: "Who this script is for (e.g. Landlord, Supplier)" },
          script: { type: Type.STRING, description: "The actual dialogue in local context/language if needed" },
          tone: { type: Type.STRING, description: "The tone of the script (Polite, Assertive, Professional)"}
        },
        required: ["context", "script"],
      },
    },
    estimated_daily_profit: { type: Type.STRING, description: "Range of estimated profit" },
    optimization_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "idea_summary",
    "target_location",
    "budget_estimate",
    "business_plan",
    "market_insights",
    "financial_breakdown",
    "marketing_strategy",
    "setup_checklist",
    "legal_requirements",
    "vendor_scripts",
    "estimated_daily_profit",
    "optimization_suggestions",
  ],
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    is_sufficient: { type: Type.BOOLEAN, description: "True if we have BOTH a specific business idea AND a specific location (City/Area). If user provides only one, this is false." },
    clarification_question: { type: Type.STRING, description: "If insufficient, ask a polite question to get the missing info (e.g., 'Great idea! Where in Bangalore do you want to start?')." },
    search_query: { type: Type.STRING, description: "If sufficient, generate a Google Search query to find local regulations, costs, and market trends." },
    identified_location: { type: Type.STRING },
    identified_business: { type: Type.STRING },
    detected_language: { type: Type.STRING, description: "The language the user is speaking (e.g., Hindi, English, Tamil)"}
  },
  required: ["is_sufficient"],
};

const SYSTEM_INSTRUCTION = `
You are NirmaanAI, an elite business consultant and architect for the Indian market.
Your goal is to convert raw voice thoughts into a "Business Consultant Grade" execution plan.

CRITICAL RULES:
1. **Depth & Reality**: Do not give generic advice. Give specific numbers, specific locations, and specific legal steps.
2. **Financial Math**: Calculate the "Break Even Point". If Rent is ₹10k and Profit/plate is ₹20, tell them exactly how many plates to sell. Provide realistic monthly cash flow projections for year 1.
3. **Hyper-Local**: If in Indiranagar, Bangalore, mention specific high-street rents vs side-road rents. Mention specific local competitors.
4. **Legal Roadmap**: Provide official government URLs (e.g., foscos.fssai.gov.in) for 'learn_more_url'. List exact documents needed. MENTION SPECIFIC LOCAL MUNICIPAL BODIES (e.g. BBMP, GHMC, BMC).
5. **Language**: Keep values in the requested language, but keys in English.
`;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Components ---

const LanguageSelector = ({ selected, onChange }: { selected: string, onChange: (lang: string) => void }) => {
  const languages = [
    { code: 'auto', label: 'Auto Detect' },
    { code: 'en-IN', label: 'English (India)' },
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'te-IN', label: 'Telugu' },
    { code: 'ta-IN', label: 'Tamil' },
    { code: 'mr-IN', label: 'Marathi' },
    { code: 'bn-IN', label: 'Bengali' },
    { code: 'kn-IN', label: 'Kannada' },
  ];

  return (
    <div className="absolute top-6 right-6 z-20">
      <div className="relative group">
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow transition-all text-zinc-700 font-medium text-sm border border-zinc-200">
          <Languages size={16} />
          {languages.find(l => l.code === selected)?.label || 'Auto Detect'}
        </button>
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-zinc-100 overflow-hidden hidden group-hover:block max-h-60 overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onChange(lang.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors ${selected === lang.code ? 'text-zinc-900 font-semibold bg-zinc-50' : 'text-zinc-600'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ThinkingOverlay = ({ steps, activeStep }: { steps: string[], activeStep: number }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-8 animate-in fade-in duration-300 w-full max-w-md mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-zinc-200 blur-2xl opacity-20 animate-pulse rounded-full"></div>
        <Loader2 size={48} className="text-zinc-900 animate-spin relative z-10" />
      </div>
      <div className="space-y-4 w-full">
        {steps.map((step, idx) => (
          <div key={idx} className={`flex items-start gap-4 transition-all duration-500 ${idx === activeStep ? 'opacity-100' : idx < activeStep ? 'opacity-40' : 'opacity-20'}`}>
             <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${idx <= activeStep ? 'bg-zinc-900' : 'bg-zinc-300'}`}></div>
             <p className={`font-medium text-lg leading-relaxed ${idx === activeStep ? 'text-zinc-900' : 'text-zinc-500'}`}>
               {step}
             </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeedbackModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [submitted, setSubmitted] = useState(false);
  
    if (!isOpen) return null;
  
    if (submitted) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl p-8 max-w-md w-full text-center animate-in zoom-in duration-200">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                        <Check size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Thank you!</h3>
                    <p className="text-zinc-600 mb-6">Your feedback helps NirmaanAI get smarter.</p>
                    <button onClick={onClose} className="px-6 py-2 bg-zinc-900 text-white rounded-lg">Close</button>
                </div>
            </div>
        )
    }
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold">Rate this Plan</h3>
             <button onClick={onClose}><X size={20} className="text-zinc-400 hover:text-zinc-900"/></button>
          </div>
          
          <div className="flex justify-center gap-2 mb-6">
             {[1,2,3,4,5].map(star => (
                 <button key={star} onClick={() => setRating(star)} className={`p-1 transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-200'}`}>
                     <Star size={32} fill={rating >= star ? "currentColor" : "none"} />
                 </button>
             ))}
          </div>
  
          <textarea 
            className="w-full border border-zinc-200 rounded-lg p-3 text-sm h-24 mb-4 focus:ring-2 focus:ring-zinc-900 outline-none resize-none"
            placeholder="What was helpful? What could be clearer?"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
  
          <button 
             onClick={() => setSubmitted(true)}
             disabled={rating === 0}
             className="w-full py-3 bg-zinc-900 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-zinc-800 transition-colors"
          >
             Submit Feedback
          </button>
        </div>
      </div>
    );
};

const Hero = ({ onPlanGenerated }: { onPlanGenerated: (plan: BusinessPlan) => void }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("auto");
  
  // State for conversation flow
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [processingState, setProcessingState] = useState<'idle' | 'analyzing' | 'researching' | 'generating'>('idle');
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, processingState]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current && language !== 'auto') {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript((prev) => finalTranscript + interimTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const startAnalysis = async () => {
    if (!transcript.trim()) return;

    // Capture the current user text and update local history logic
    const userText = transcript;
    setTranscript(""); 
    
    // Optimistically update UI
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);

    // 1. ANALYZE INTENT
    setProcessingState('analyzing');
    setThinkingSteps(["Reading context...", "Identifying business idea...", "Locating target area..."]);
    setActiveStepIndex(0);

    try {
      // Create a comprehensive history string including the latest message
      const historyText = newMessages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

      const analysisResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
        Analyze this FULL conversation history to check if we have BOTH a Business Idea AND a specific Target Location.
        
        CONVERSATION HISTORY:
        ${historyText}
        
        SELECTED LANGUAGE: ${language}
        
        INSTRUCTIONS:
        - If the user just answered a question (e.g., "Bangalore"), combine it with previous turns to understand the full context.
        - "Is sufficient" means you know WHAT they want to do and WHERE they want to do it.
        - If insufficient, generate a specific clarification question IN THE SELECTED LANGUAGE (or detected language if auto).
        
        Return JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
        },
      });

      const analysis = JSON.parse(analysisResponse.text!) as AnalysisResult;

      if (!analysis.is_sufficient) {
        // NEED CLARIFICATION
        setProcessingState('idle'); // Back to idle to allow input
        setMessages(prev => [...prev, { role: 'ai', text: analysis.clarification_question || "Could you provide more details about the location or idea?" }]);
        return;
      }

      // 2. RESEARCH (Google Search)
      setProcessingState('researching');
      
      // Enhanced search query for granular details
      const researchQuery = analysis.search_query || `
        Start ${analysis.identified_business} in ${analysis.identified_location} India guide.
        Find:
        1. Exact government permits fees and process (FSSAI, Trade license) for ${analysis.identified_business} in ${analysis.identified_location}.
        2. Real estate rental listings for commercial shop in ${analysis.identified_location} price.
        3. Wholesale rates for raw materials for ${analysis.identified_business} in ${analysis.identified_location}.
        4. Competitor menu pricing.
        5. Specific government schemes for street vendors or small business in ${analysis.identified_location}.
      `;

      setThinkingSteps([
        `Target Identified: ${analysis.identified_business} in ${analysis.identified_location}`,
        `Running Search: "${researchQuery.substring(0, 60)}..."`,
        "Analyzing real-time market data..."
      ]);
      setActiveStepIndex(1);
      
      const researchResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: researchQuery,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const researchContext = researchResponse.text; // Text summary from search

      // 3. GENERATE PLAN
      setProcessingState('generating');
      setThinkingSteps([
        "Research complete.",
        "Synthesizing 50+ data points...",
        "Calculating financial projections...",
        "Drafting final consultant report..."
      ]);
      setActiveStepIndex(2);

      // Determine the output language based on selection or detection
      const outputLanguageInstruction = `The user selected language is: ${language}. Ensure the CONTENT of the JSON (values) is in this language.`;

      // Use PRO model for deep analysis
      const planResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview", 
        contents: `
          Create a "Business Consultant Grade" execution plan based on this user input and market research.
          
          User Input History: ${historyText}
          
          ${outputLanguageInstruction}
          
          Market Research Context (Real-time data):
          ${researchContext}
          
          MANDATORY REQUIREMENTS:
          1. **Financial Breakdown**: Estimate fixed costs (Rent, Salaries) vs Variable costs. Calculate the "Break Even Point" (e.g. "Sell 50 units/day to cover costs"). Include a 'learn_more_url' for break even concepts.
          2. **Cash Flow**: Provide 'financial_projections_year_1' with realistic monthly revenue, expense, and profit growth (starting slow).
          3. **Legal Roadmap**: Step-by-step for FSSAI/Licenses with OFFICIAL FEES. Provide 'processing_time', list of 'documents_required', and official 'learn_more_url' (e.g. fssai.gov.in). IMPORTANT: Fill 'local_authority_details' with specific municipal body info (e.g. BBMP for Bangalore).
          4. **Marketing**: Suggest WhatsApp strategies, Subscription models, etc.
          5. **Location**: Be specific about rental costs in ${analysis.identified_location}.
        `,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: planSchema,
          thinkingConfig: { thinkingBudget: 4096 } // Enable thinking for deep analysis
        },
      });
      
      const plan = JSON.parse(planResponse.text!) as BusinessPlan;
      onPlanGenerated(plan);

    } catch (error) {
      console.error("Error in process:", error);
      setProcessingState('idle');
      setMessages(prev => [...prev, { role: 'ai', text: "I encountered an error analyzing that. Could you try again?" }]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 text-center max-w-4xl mx-auto relative font-sans text-zinc-900">
      <LanguageSelector selected={language} onChange={setLanguage} />
      
      <div className="mb-12 space-y-4">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-zinc-900">
          Nirmaan<span className="text-zinc-400">AI</span>
        </h1>
        <p className="text-xl text-zinc-500 max-w-xl mx-auto">
          Turn your voice into a <span className="text-zinc-900 font-semibold underline decoration-zinc-300 decoration-2">business plan</span>.
        </p>
      </div>

      <div className="w-full max-w-2xl relative">
        <div className={`relative z-10 bg-white shadow-xl shadow-zinc-200/50 rounded-2xl p-6 border border-zinc-200 transition-all duration-300 min-h-[350px] flex flex-col justify-center`}>
          
          {processingState !== 'idle' ? (
             <ThinkingOverlay steps={thinkingSteps} activeStep={activeStepIndex} />
          ) : (
            <div className="flex flex-col h-full justify-between gap-6">
              
              {/* Conversation Area */}
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-4 px-2 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="text-zinc-400 text-lg pt-8">
                    Tap the mic and say something like:<br/>
                    <span className="font-semibold text-zinc-900">"I want to open a tea stall in Indiranagar, Bangalore"</span>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-left text-sm font-medium ${
                         msg.role === 'user' 
                         ? 'bg-zinc-900 text-white rounded-br-none' 
                         : 'bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-bl-none'
                       }`}>
                         {msg.text}
                       </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef}></div>
              </div>

              {/* Input Area */}
              <div className="flex flex-col gap-4">
                <textarea
                  className="w-full text-xl font-medium text-zinc-900 placeholder-zinc-300 resize-none outline-none bg-transparent text-center leading-relaxed"
                  rows={2}
                  placeholder={messages.length > 0 ? "Type your reply..." : "Tap mic to speak..."}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      startAnalysis();
                    }
                  }}
                />

                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={toggleListening}
                    className={`p-4 rounded-full transition-all duration-300 flex items-center justify-center border ${
                      isListening
                        ? "bg-red-500 text-white border-red-500 animate-pulse"
                        : "bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {isListening ? <StopCircle size={24} fill="currentColor" /> : <Mic size={24} />}
                  </button>
                  
                  <button
                    onClick={startAnalysis}
                    disabled={!transcript}
                    className="group flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
                  >
                    <span className="font-semibold text-lg">{messages.length > 0 ? 'Reply' : 'Start Planning'}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {processingState === 'idle' && (
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {["Market Research", "Financial Analysis", "Legal Roadmap"].map((feat, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 bg-white text-zinc-500 text-xs font-medium uppercase tracking-wider">
                  <CheckCircle2 size={14} className="text-zinc-900" /> {feat}
              </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GeneratedImage = ({ summary, location }: { summary: string, location: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generate = async () => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: `Generate a realistic, high-quality, concept image of a small business in India: ${summary}. Location context: ${location}. Street photography style, sunny day.`,
              },
            ],
          },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString: string = part.inlineData.data;
                setImageUrl(`data:image/png;base64,${base64EncodeString}`);
                break;
            }
        }
      } catch (e) {
        console.error("Image gen failed", e);
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, [summary, location]);

  if (loading) {
    return (
      <div className="w-full h-64 bg-zinc-100 rounded-xl flex items-center justify-center animate-pulse border border-zinc-200">
        <div className="flex flex-col items-center gap-2 text-zinc-400">
            <Sparkles size={20} className="animate-spin" />
            <span className="text-xs font-medium uppercase tracking-wide">Generating Concept...</span>
        </div>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="w-full h-64 relative rounded-xl overflow-hidden border border-zinc-200 group">
      <img src={imageUrl} alt="Business Concept" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
        <span className="text-white font-bold text-xs flex items-center gap-1.5">
            <Sparkles size={10} className="text-zinc-200"/> AI Concept
        </span>
      </div>
    </div>
  );
};

// --- Small UI Primitives ---

const Card: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-zinc-200 shadow-sm ${className}`}>
        {children}
    </div>
);

const Badge: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${className}`}>
        {children}
    </span>
);

const PlanDashboard = ({ plan, onReset }: { plan: BusinessPlan; onReset: () => void }) => {
  const [currentPlan, setCurrentPlan] = useState<BusinessPlan>(plan);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [chatFocusMode, setChatFocusMode] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // New States
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [showScriptInput, setShowScriptInput] = useState(false);
  const [scriptContextInput, setScriptContextInput] = useState("");
  const [scriptTone, setScriptTone] = useState("Polite");
  const [mapCategory, setMapCategory] = useState("wholesale markets");
  const [isDeepSearchingMap, setIsDeepSearchingMap] = useState(false);
  const [deepSearchMapResults, setDeepSearchMapResults] = useState<PlaceResult[]>([]);
  const [selectedMapLocation, setSelectedMapLocation] = useState<string | null>(null);

  // Financial Calculator States
  const [customPrice, setCustomPrice] = useState(0);
  const [customVariableCost, setCustomVariableCost] = useState(0);
  const [customFixedCost, setCustomFixedCost] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);

  // Legal Expansion States
  const [expandedLegalItem, setExpandedLegalItem] = useState<number | null>(null);
  const [verifyingLegal, setVerifyingLegal] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // --- Calculations for Break Even ---
  const parseCurrency = (str: string) => {
    if(!str) return 0;
    const match = str.match(/[\d,.]+/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  };

  useEffect(() => {
     // Initialize Calculator values
     const variable = parseCurrency(currentPlan.financial_breakdown.variable_costs_per_unit);
     const margin = parseCurrency(currentPlan.financial_breakdown.profit_margin_per_unit);
     const fixed = currentPlan.financial_breakdown.fixed_costs_monthly.reduce((acc, str) => acc + parseCurrency(str), 0);
     
     setCustomPrice(variable + margin);
     setCustomVariableCost(variable);
     setCustomFixedCost(fixed);

     // Show feedback modal on first load after a delay
     const timer = setTimeout(() => {
         setShowFeedbackModal(true);
     }, 10000);
     return () => clearTimeout(timer);
  }, []); // Run once on mount

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isRefining, chatFocusMode]);

  const toggleStep = (index: number) => {
    const newSet = new Set(completedSteps);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setCompletedSteps(newSet);
  };

  // --- Voice Input Logic for Refinement ---
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Single utterance
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN'; // Default to English/Indian English

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
         setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceRefinement = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          setChatInput(""); // Clear previous input
          recognitionRef.current?.start();
          setIsListening(true);
      }
  };

  const handleRefine = async (e?: React.FormEvent, manualInput?: string) => {
    if (e) e.preventDefault();
    const inputToUse = manualInput || chatInput;
    if (!inputToUse.trim()) return;

    const userMsg = inputToUse;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsRefining(true);
    setChatFocusMode(false); // Reset focus mode if active

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Original Plan: ${JSON.stringify(currentPlan)}.
          Conversation History: ${JSON.stringify(chatHistory.map(m => m.text))}.
          User Request: "${userMsg}".
          
          Task: 
          1. Update the JSON plan based on the user's request. 
          2. Maintain the exact JSON schema. 
          3. Be creative and helpful.
          4. CRITICAL: If the user changes the location (e.g. from Bangalore to Mumbai), YOU MUST update the 'market_insights' (rental costs, competitors, regulations) to reflect the NEW location.
        `,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: planSchema,
        },
      });
      
      const jsonText = response.text;
      if (jsonText) {
        const newPlan = JSON.parse(jsonText) as BusinessPlan;
        setCurrentPlan(newPlan);
        // Add feedback mechanism here
        setChatHistory(prev => [
          ...prev, 
          { role: 'ai', text: "Plan updated. Please review the dashboard." },
          { role: 'ai', text: "How does this look?", feedback: undefined } // Prompt for feedback
        ]);
        // Trigger feedback modal again after interaction
        setTimeout(() => setShowFeedbackModal(true), 5000);
      }
    } catch (error) {
      console.error("Refinement failed", error);
      setChatHistory(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't process that update. Try again." }]);
    } finally {
      setIsRefining(false);
    }
  };

  const handleFeedback = (index: number, type: 'up' | 'down') => {
      const newHistory = [...chatHistory];
      if (newHistory[index]) {
          newHistory[index].feedback = type;
          setChatHistory(newHistory);
      }
      
      if (type === 'down') {
          // Trigger adjustment flow
          setChatFocusMode(true);
          setChatInput("I'd like to adjust...");
          setTimeout(() => chatInputRef.current?.focus(), 100);
      }
  };

  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptContextInput.trim()) return;
    setIsGeneratingScript(true);

    try {
      const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Generate a short negotiation script for a business owner talking to a "${scriptContextInput}" in the context of: ${currentPlan.idea_summary} in ${currentPlan.target_location}. Tone: ${scriptTone}. Return JSON: { "context": "${scriptContextInput}", "script": "..." }`,
          config: {
              responseMimeType: "application/json",
          }
      });
      const newScript = JSON.parse(response.text!) as VendorScript;
      setCurrentPlan(prev => ({
          ...prev,
          vendor_scripts: [...prev.vendor_scripts, newScript]
      }));
      setScriptContextInput("");
      setShowScriptInput(false);
    } catch(e) {
        console.error("Script gen error", e);
    } finally {
        setIsGeneratingScript(false);
    }
  };

  const handleRegenerateScript = async (index: number) => {
     const scriptToRedo = currentPlan.vendor_scripts[index];
     setIsGeneratingScript(true); // Reuse loader state
     try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Regenerate this negotiation script with a slightly different, perhaps more effective phrasing. Keep the context "${scriptToRedo.context}". Original: "${scriptToRedo.script}". Return JSON: { "context": "${scriptToRedo.context}", "script": "..." }`,
            config: {
                responseMimeType: "application/json",
            }
        });
        const newScript = JSON.parse(response.text!) as VendorScript;
        const newScripts = [...currentPlan.vendor_scripts];
        newScripts[index] = newScript;
        setCurrentPlan(prev => ({
            ...prev,
            vendor_scripts: newScripts
        }));
     } catch (e) {
        console.error("Regen failed", e);
     } finally {
        setIsGeneratingScript(false);
     }
  };

  const handleDeepMapSearch = async () => {
    setIsDeepSearchingMap(true);
    setDeepSearchMapResults([]);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find specific 3 top rated "${mapCategory}" in "${currentPlan.target_location}" for a small business. Provide valid JSON array with keys: name, address, rating (string).`,
            config: {
                tools: [{ googleMaps: {} }],
                responseMimeType: "application/json"
            }
        });
        
        const places = JSON.parse(response.text!) as PlaceResult[];
        if (Array.isArray(places)) {
             setDeepSearchMapResults(places);
        }

    } catch(e) {
        console.error("Map search failed", e);
    } finally {
        setIsDeepSearchingMap(false);
    }
  };

  const handleVerifyLegal = async (index: number) => {
      setVerifyingLegal(index);
      const item = currentPlan.legal_requirements[index];
      try {
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Find the absolute latest official requirements for "${item.name}" in "${currentPlan.target_location}". 
              Update the following fields if changed: estimated_cost, processing_time, documents_required (list specific forms), local_authority_details.
              Return JSON matching the RegulatoryDetail structure.`,
              config: {
                  tools: [{ googleSearch: {} }],
                  responseMimeType: "application/json"
              }
          });
          
          const updatedItem = JSON.parse(response.text!) as RegulatoryDetail;
          const newReqs = [...currentPlan.legal_requirements];
          newReqs[index] = { ...item, ...updatedItem };
          setCurrentPlan(prev => ({
              ...prev,
              legal_requirements: newReqs
          }));

      } catch (e) {
          console.error("Legal verify failed", e);
      } finally {
          setVerifyingLegal(null);
      }
  };

  const handleCopyAllScripts = () => {
    const text = currentPlan.vendor_scripts.map(s => `[${s.context}]: ${s.script}`).join("\n\n");
    navigator.clipboard.writeText(text);
  };
  
  const playScript = (text: string) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to detect if script has english characters, if mostly not, assume hindi/local
      utterance.lang = 'hi-IN'; // Defaulting to Hindi/Indian context usually covers mixed scripts better
      window.speechSynthesis.speak(utterance);
  };
  
  const copyScript = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Helper to add text and wrap it
    const addWrappedText = (text: string, x: number, yPos: number, maxWidth: number, fontSize: number, color: [number, number, number] = [0, 0, 0], fontStyle = "normal") => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("helvetica", fontStyle);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPos);
        return yPos + (lines.length * (fontSize / 2)) + 2; // Return new Y position
    };

    // Header
    y = addWrappedText("NirmaanAI Business Execution Plan", 10, y, pageWidth - 20, 24, [0, 0, 0], "bold");
    y += 5;

    // Executive Summary
    y = addWrappedText(`Business Concept: ${currentPlan.idea_summary}`, 10, y, pageWidth - 20, 14, [0, 0, 0], "bold");
    y = addWrappedText(`Location: ${currentPlan.target_location}`, 10, y, pageWidth - 20, 12, [80, 80, 80]);
    y += 10;

    // Financial Deep Dive
    y = addWrappedText("Financial Analysis", 10, y, pageWidth - 20, 16, [0, 0, 0], "bold");
    y = addWrappedText(`Investment Range: ${currentPlan.budget_estimate.currency} ${currentPlan.budget_estimate.min} - ${currentPlan.budget_estimate.max}`, 10, y, pageWidth - 20, 11);
    y = addWrappedText(`Daily Profit Estimate: ${currentPlan.estimated_daily_profit}`, 10, y, pageWidth - 20, 11);
    y = addWrappedText(`Break-Even Analysis: ${currentPlan.financial_breakdown.break_even_analysis}`, 10, y, pageWidth - 20, 11, [0, 0, 0], "italic");
    y += 5;
    
    // Fixed Costs
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Estimated Fixed Monthly Costs:", 10, y);
    y += 6;
    currentPlan.financial_breakdown.fixed_costs_monthly.forEach(cost => {
        y = addWrappedText(`• ${cost}`, 15, y, pageWidth - 30, 10);
    });
    y += 5;

    // Action Checklist
    if (y > 250) { doc.addPage(); y = 20; }
    y = addWrappedText("Execution Checklist", 10, y, pageWidth - 20, 16, [0, 0, 0], "bold");
    currentPlan.setup_checklist.forEach(step => {
        y = addWrappedText(`[ ] ${step}`, 10, y, pageWidth - 20, 11);
        if (y > 280) { doc.addPage(); y = 20; }
    });
    y += 10;

    // Legal Roadmap
    if (y > 250) { doc.addPage(); y = 20; }
    y = addWrappedText("Legal & Compliance Roadmap", 10, y, pageWidth - 20, 16, [0, 0, 0], "bold");
    currentPlan.legal_requirements.forEach(req => {
        y = addWrappedText(`${req.name}`, 10, y, pageWidth - 20, 12, [0, 0, 0], "bold");
        y = addWrappedText(`Steps: ${req.step_by_step}`, 10, y, pageWidth - 20, 10);
        y = addWrappedText(`Est. Cost: ${req.estimated_cost}`, 10, y, pageWidth - 20, 10); 
        y += 4;
        if (y > 280) { doc.addPage(); y = 20; }
    });

    // Market Insights
    if (y > 250) { doc.addPage(); y = 20; }
    y = addWrappedText("Market Intelligence", 10, y, pageWidth - 20, 16, [0, 0, 0], "bold");
    y = addWrappedText(`Rent Estimate: ${currentPlan.market_insights.rental_costs}`, 10, y, pageWidth - 20, 11);
    y = addWrappedText(`Competitor Pricing: ${currentPlan.market_insights.competitor_pricing}`, 10, y, pageWidth - 20, 11);
    y += 5;
    doc.text("Growth Strategies:", 10, y);
    y += 6;
    currentPlan.marketing_strategy.forEach(s => {
        y = addWrappedText(`• ${s}`, 15, y, pageWidth - 30, 10);
    });

    doc.save("Nirmaan_Business_Plan.pdf");
  };
  
  const quickRefinePrompts = [
      "Add vegetarian options",
      "Reduce startup cost by 20%",
      "Shift to a busy market area",
      "Focus on college students"
  ];

  // Calculated Break Even for Display
  const breakEvenUnits = Math.ceil(customFixedCost / (customPrice - customVariableCost));

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 font-sans text-zinc-900">
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <button onClick={onReset} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900">
                <ArrowRight className="rotate-180" size={20} />
             </button>
             <div>
                <h2 className="text-xl font-bold text-zinc-900 leading-none">{currentPlan.idea_summary}</h2>
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 mt-1.5 uppercase tracking-wide">
                    <span className="flex items-center gap-1"><MapPin size={12}/> {currentPlan.target_location}</span>
                </div>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-zinc-200/50">
              <Download size={16} /> Export PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Top Section: Visuals & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <GeneratedImage summary={currentPlan.idea_summary} location={currentPlan.target_location} />
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-8 flex flex-col justify-center">
                    <div className="text-zinc-500 text-xs font-bold mb-2 uppercase tracking-widest">Investment Required</div>
                    <div className="text-4xl font-bold text-zinc-900 flex items-baseline gap-2">
                        <span className="text-2xl text-zinc-400">₹</span>
                        {currentPlan.budget_estimate.min.toLocaleString()} 
                        <span className="text-2xl text-zinc-400 font-light">-</span>
                        <span className="text-2xl text-zinc-400">₹</span>
                        {currentPlan.budget_estimate.max.toLocaleString()}
                    </div>
                </Card>
                <Card className="p-8 flex flex-col justify-center">
                    <div className="text-zinc-500 text-xs font-bold mb-2 uppercase tracking-widest">Target Audience</div>
                    <div className="text-xl font-bold text-zinc-900 leading-snug">{currentPlan.business_plan.target_customers}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                         {currentPlan.business_plan.products.slice(0,3).map((p, i) => (
                             <Badge key={i} className="bg-zinc-100 text-zinc-700 border border-zinc-200">{p}</Badge>
                         ))}
                    </div>
                </Card>
            </div>
        </div>

        {/* Market Intelligence Section - With Maps */}
        <Card className="p-0 overflow-hidden border-blue-200">
           <div className="p-8 bg-blue-50/30">
               <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                      <TrendingUp size={24} />
                  </div>
                  <h3 className="font-bold text-2xl text-zinc-900">Market Intelligence</h3>
                  <Badge className="ml-auto bg-blue-600 text-white border-blue-700">Live Data</Badge>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 mb-8">
                  {/* Opportunities */}
                  <div className="space-y-4">
                     <div className="text-xs font-bold text-blue-800 uppercase tracking-widest">Opportunities</div>
                     <ul className="space-y-3">
                       {currentPlan.market_insights.opportunities.map((op, i) => (
                         <li key={i} className="text-sm text-zinc-800 font-medium flex items-start gap-2">
                            <Check size={16} className="text-blue-500 mt-0.5 flex-shrink-0"/> 
                            <span className="flex-1">{op}</span>
                         </li>
                       ))}
                     </ul>
                  </div>
    
                  {/* Competitor Pricing */}
                  <div className="space-y-4">
                     <div className="text-xs font-bold text-blue-800 uppercase tracking-widest">Pricing & Rent</div>
                     <div>
                         <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Competitor Avg.</p>
                         <p className="text-base text-zinc-900 font-bold leading-relaxed">{currentPlan.market_insights.competitor_pricing}</p>
                     </div>
                     <div className="pt-2 border-t border-blue-100">
                        <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Est. Rental Cost</p>
                        <p className="text-base text-zinc-900 font-bold">{currentPlan.market_insights.rental_costs}</p>
                     </div>
                  </div>

                  {/* Trends */}
                  <div className="space-y-4">
                     <div>
                        <div className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2">Seasonal Trend</div>
                        <p className="text-sm text-zinc-700 font-medium bg-white p-3 rounded-lg border border-blue-100 shadow-sm">{currentPlan.market_insights.seasonal_trends[0]}</p>
                     </div>
                  </div>
               </div>
           </div>
           
           {/* Interactive Map Section */}
           <div className="bg-zinc-100 p-1">
               <div className="flex gap-1 p-2 bg-white border-b border-zinc-200">
                   <button onClick={() => setMapCategory("Wholesale Markets")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mapCategory === 'Wholesale Markets' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>Wholesale Markets</button>
                   <button onClick={() => setMapCategory("Competitors")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mapCategory === 'Competitors' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>Competitors</button>
                   <button onClick={() => setMapCategory("Government Offices")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mapCategory === 'Government Offices' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>Govt Offices</button>
                   <button onClick={handleDeepMapSearch} className="ml-auto flex items-center gap-2 px-3 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                       {isDeepSearchingMap ? <Loader2 size={16} className="animate-spin"/> : <Search size={16} />} 
                       Deep Dive
                   </button>
               </div>
               <div className="flex flex-col md:flex-row h-96">
                   <div className="flex-1 bg-zinc-200 relative">
                        <iframe 
                                width="100%" 
                                height="100%" 
                                style={{border:0}} 
                                loading="lazy" 
                                allowFullScreen 
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedMapLocation ? selectedMapLocation : (mapCategory + " in " + currentPlan.target_location))}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        ></iframe>
                   </div>
                   {deepSearchMapResults.length > 0 && (
                       <div className="w-full md:w-80 bg-white border-l border-zinc-200 overflow-y-auto">
                           <div className="p-3 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-500 uppercase">Nearby Places</span>
                                <button onClick={() => setDeepSearchMapResults([])}><X size={14} className="text-zinc-400"/></button>
                           </div>
                           <div className="divide-y divide-zinc-100">
                               {deepSearchMapResults.map((place, idx) => (
                                   <div key={idx} className="p-3 hover:bg-zinc-50 cursor-pointer transition-colors" onClick={() => setSelectedMapLocation(place.name + " " + place.address)}>
                                       <div className="font-bold text-sm text-zinc-900 mb-1">{place.name}</div>
                                       <div className="text-xs text-zinc-500 mb-1 flex items-start gap-1">
                                           <MapPin size={10} className="mt-0.5"/> {place.address}
                                       </div>
                                       <div className="text-xs font-medium text-amber-600 flex items-center gap-1">
                                           <Star size={10} fill="currentColor" /> {place.rating}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}
               </div>
           </div>
        </Card>

        {/* Growth Strategies */}
        <Card className="p-6 border-l-4 border-l-amber-400">
            <div className="flex items-start gap-4">
                 <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                     <Lightbulb size={24} />
                 </div>
                 <div className="space-y-4 flex-1">
                    <h4 className="font-bold text-lg text-zinc-900">Strategic Growth Plan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentPlan.marketing_strategy.map((strat, i) => (
                            <div key={i} className="flex gap-3 text-sm text-zinc-700 font-medium">
                                <span className="text-amber-500 font-bold">{i+1}.</span>
                                {strat}
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </Card>

        {/* Financial Deep Dive */}
        <Card className="overflow-hidden">
             <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
                 <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                    <Calculator size={20} />
                 </div>
                 <h3 className="font-bold text-lg text-zinc-900">Financial Viability</h3>
             </div>
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                     <div>
                         <div className="flex items-center gap-2 mb-4">
                            <h4 className="font-bold text-xs text-zinc-500 uppercase tracking-widest">Break-Even Analysis</h4>
                            <button onClick={() => setShowCalculator(!showCalculator)} className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                {showCalculator ? "Hide Calculator" : "Use Interactive Calculator"}
                            </button>
                         </div>
                         
                         {showCalculator ? (
                             <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 space-y-4 animate-in fade-in slide-in-from-top-4">
                                 <h5 className="font-bold text-emerald-800 text-sm flex items-center gap-2"><Calculator size={14}/> Break-Even Calculator</h5>
                                 <div className="grid grid-cols-1 gap-4">
                                     <div>
                                         <label className="text-xs font-bold text-emerald-700 block mb-1">Avg Selling Price (₹)</label>
                                         <input type="number" value={customPrice} onChange={e => setCustomPrice(parseFloat(e.target.value))} className="w-full p-2 rounded border border-emerald-200 text-sm" />
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-emerald-700 block mb-1">Variable Cost/Unit (₹)</label>
                                         <input type="number" value={customVariableCost} onChange={e => setCustomVariableCost(parseFloat(e.target.value))} className="w-full p-2 rounded border border-emerald-200 text-sm" />
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-emerald-700 block mb-1">Total Fixed Costs (₹)</label>
                                         <input type="number" value={customFixedCost} onChange={e => setCustomFixedCost(parseFloat(e.target.value))} className="w-full p-2 rounded border border-emerald-200 text-sm" />
                                     </div>
                                 </div>
                                 <div className="pt-4 border-t border-emerald-200">
                                     <div className="text-xs text-emerald-600 font-medium text-center mb-1">You need to sell</div>
                                     <div className="text-3xl font-bold text-emerald-900 text-center">{isFinite(breakEvenUnits) && breakEvenUnits > 0 ? breakEvenUnits : "∞"} Units</div>
                                     <div className="text-xs text-emerald-600 font-medium text-center mt-1">per month to break even</div>
                                 </div>
                             </div>
                         ) : (
                             <>
                                <p className="text-3xl font-bold text-zinc-900 leading-relaxed">
                                    {currentPlan.financial_breakdown.break_even_analysis}
                                </p>
                                <p className="text-sm text-zinc-500 mt-2 font-medium">Target to cover daily expenses.</p>
                             </>
                         )}
                     </div>

                     <div className="space-y-4">
                         <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                             <span className="text-zinc-600 text-sm font-medium">Variable Cost (per unit)</span>
                             <span className="font-bold text-zinc-900">{currentPlan.financial_breakdown.variable_costs_per_unit}</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                             <span className="text-zinc-600 text-sm font-medium">Profit Margin (per unit)</span>
                             <span className="font-bold text-emerald-600">{currentPlan.financial_breakdown.profit_margin_per_unit}</span>
                         </div>
                         <div>
                             <span className="text-zinc-600 text-sm font-medium block mb-2">Fixed Monthly Costs</span>
                             <div className="flex flex-wrap gap-2">
                                 {currentPlan.financial_breakdown.fixed_costs_monthly.map((c, i) => (
                                     <Badge key={i} className="bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">{c}</Badge>
                                 ))}
                             </div>
                         </div>
                     </div>
                 </div>
                 <div className="space-y-4">
                     <h4 className="font-bold text-xs text-zinc-500 uppercase tracking-widest">Year 1 Cash Flow Projection</h4>
                     <div className="space-y-3 pt-2">
                        {currentPlan.financial_breakdown.financial_projections_year_1 && currentPlan.financial_breakdown.financial_projections_year_1.slice(0, 6).map((proj, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <div className="w-8 text-zinc-400 font-mono">M{proj.month}</div>
                                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden flex">
                                    <div className="bg-emerald-400 h-full" style={{width: `${(proj.revenue / (currentPlan.financial_breakdown.financial_projections_year_1[5].revenue * 1.2)) * 100}%`}}></div>
                                </div>
                                <div className="w-20 text-right font-medium text-emerald-700">+₹{proj.profit}</div>
                            </div>
                        ))}
                        <p className="text-xs text-zinc-400 italic mt-2 text-center">Projected growth for first 6 months</p>
                     </div>
                 </div>
             </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Checklist & Legal */}
            <div className="lg:col-span-2 space-y-8">
                {/* Checklist */}
                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                            Action Plan
                        </h3>
                        <Badge className="bg-zinc-900 text-white">
                            {completedSteps.size}/{currentPlan.setup_checklist.length}
                        </Badge>
                    </div>
                    <div className="p-4 space-y-2">
                        {currentPlan.setup_checklist.map((step, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => toggleStep(idx)}
                                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                                    completedSteps.has(idx) 
                                        ? 'bg-zinc-50 border-zinc-200' 
                                        : 'bg-white border-transparent hover:border-zinc-200 hover:bg-zinc-50'
                                }`}
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                    completedSteps.has(idx) ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'
                                }`}>
                                    {completedSteps.has(idx) && <Check size={12} className="text-white" />}
                                </div>
                                <div className={`flex-1 text-sm ${completedSteps.has(idx) ? 'line-through text-zinc-400' : 'text-zinc-700 font-medium'}`}>
                                    {step}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Legal Roadmap - Detailed */}
                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-zinc-100">
                        <h3 className="font-bold text-lg text-zinc-900">
                             Legal & Compliance
                        </h3>
                    </div>
                    <div className="divide-y divide-zinc-100">
                        {currentPlan.legal_requirements.map((req, idx) => (
                            <div key={idx} className="p-6 hover:bg-zinc-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-zinc-900 text-base">{req.name}</h4>
                                        {req.learn_more_url && (
                                            <a href={req.learn_more_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                        <button onClick={() => handleVerifyLegal(idx)} className="text-xs flex items-center gap-1 text-zinc-400 hover:text-zinc-900 transition-colors ml-2" title="Verify with latest live data">
                                           {verifyingLegal === idx ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>} Verify
                                        </button>
                                    </div>
                                    <Badge className="bg-red-50 text-red-600 border border-red-100">
                                        Est: {req.estimated_cost}
                                    </Badge>
                                </div>
                                <div className="text-sm text-zinc-600 space-y-4">
                                    <p className="leading-relaxed">{req.step_by_step}</p>
                                    
                                    {req.local_authority_details && (
                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-3">
                                            <Building2 size={16} className="text-amber-600 mt-1 flex-shrink-0" />
                                            <div>
                                                <span className="text-xs font-bold text-amber-700 uppercase">Local Authority Rule</span>
                                                <p className="text-zinc-700 text-xs mt-1">{req.local_authority_details}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 pt-1">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 text-xs font-medium bg-zinc-100 px-3 py-1.5 rounded-md text-zinc-600">
                                                <Clock size={12}/> {req.processing_time}
                                            </div>
                                            <button 
                                                onClick={() => setExpandedLegalItem(expandedLegalItem === idx ? null : idx)}
                                                className="flex items-center gap-2 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 transition-colors px-3 py-1.5 rounded-md text-zinc-600"
                                            >
                                                <FileCheck size={12}/> {req.documents_required.length} Documents Required
                                                {expandedLegalItem === idx ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                            </button>
                                        </div>
                                        
                                        {expandedLegalItem === idx && (
                                            <div className="pl-2 border-l-2 border-zinc-200 mt-2 animate-in slide-in-from-top-2 fade-in">
                                                <ul className="text-xs text-zinc-600 space-y-1">
                                                    {req.documents_required.map((doc, dIdx) => (
                                                        <li key={dIdx} className="flex items-start gap-2">
                                                            <div className="mt-1 w-1 h-1 bg-zinc-400 rounded-full flex-shrink-0"></div>
                                                            {doc}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Right Col: Chat & Scripts */}
            <div className="space-y-6">
                 {/* Chat Widget */}
                <Card className="overflow-hidden flex flex-col h-[600px] shadow-lg">
                     <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
                        <div>
                            <span className="font-bold flex items-center gap-2"><Sparkles size={16} className="text-white"/> Refine Plan</span>
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
                        {chatHistory.length === 0 && (
                            <div className="text-center text-zinc-400 text-sm mt-10">
                                Ask to change budget, location,<br/>or add items...
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
                                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-zinc-900 text-white rounded-tr-none' 
                                    : 'bg-white border border-zinc-200 text-zinc-700 rounded-tl-none shadow-sm'
                                }`}>
                                    {msg.text}
                                </div>
                                {msg.role === 'ai' && i === chatHistory.length - 1 && (
                                    <div className="flex gap-2 px-1 transition-opacity opacity-50 hover:opacity-100">
                                        <button 
                                            onClick={() => handleFeedback(i, 'up')}
                                            className={`p-1 rounded hover:bg-zinc-200 transition-colors ${msg.feedback === 'up' ? 'text-green-600' : 'text-zinc-400'}`}
                                        >
                                            <ThumbsUp size={12} />
                                        </button>
                                        <button 
                                            onClick={() => handleFeedback(i, 'down')}
                                            className={`p-1 rounded hover:bg-zinc-200 transition-colors ${msg.feedback === 'down' ? 'text-red-600' : 'text-zinc-400'}`}
                                        >
                                            <ThumbsDown size={12} />
                                        </button>
                                        {chatFocusMode && msg.feedback === 'down' && (
                                            <span className="text-xs text-zinc-400 self-center ml-2">Tell us what to fix below ↓</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={chatEndRef}></div>
                     </div>
                     
                     <div className="p-3 bg-white border-t border-zinc-100 space-y-3">
                        {/* Quick Refine Prompts */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {quickRefinePrompts.map((prompt, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleRefine(undefined, prompt)}
                                    className="whitespace-nowrap px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs rounded-full transition-colors font-medium border border-zinc-200"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={(e) => handleRefine(e)} className="flex gap-2">
                            <button type="button" onClick={toggleVoiceRefinement} className={`p-2 rounded-lg transition-colors border ${isListening ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}>
                                {isListening ? <StopCircle size={18} /> : <Mic size={18} />}
                            </button>
                            <input 
                                ref={chatInputRef}
                                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200 transition-all text-zinc-900 placeholder:text-zinc-400"
                                placeholder={isListening ? "Listening..." : "Type a change..."}
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                            />
                            <button disabled={isRefining} className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                                {isRefining ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                            </button>
                        </form>
                     </div>
                </Card>

                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                            Negotiation Scripts
                        </h3>
                        <button onClick={handleCopyAllScripts} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors">
                            <Copy size={12}/> Copy All
                        </button>
                    </div>
                    <div className="divide-y divide-zinc-100">
                        {currentPlan.vendor_scripts.map((script, idx) => (
                            <div key={idx} className="p-6 hover:bg-zinc-50 transition-colors group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-blue-50 text-blue-700 border border-blue-100">
                                            {script.context}
                                        </Badge>
                                        {script.tone && <span className="text-xs text-zinc-400 ml-1">({script.tone})</span>}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleRegenerateScript(idx)} className="p-1.5 hover:bg-zinc-200 rounded-md text-zinc-500 hover:text-zinc-900 transition-colors" title="Regenerate">
                                            <RefreshCw size={16} />
                                        </button>
                                        <button onClick={() => playScript(script.script)} className="p-1.5 hover:bg-zinc-200 rounded-md text-zinc-500 hover:text-zinc-900 transition-colors" title="Play Audio">
                                            <Volume2 size={16} />
                                        </button>
                                        <button onClick={() => copyScript(script.script)} className="p-1.5 hover:bg-zinc-200 rounded-md text-zinc-500 hover:text-zinc-900 transition-colors" title="Copy Text">
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-lg text-zinc-700 italic border-l-2 border-zinc-300 text-base leading-relaxed">
                                    "{script.script}"
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Add Script Section */}
                    <div className="p-4 bg-zinc-50 border-t border-zinc-100">
                        {!showScriptInput ? (
                            <button 
                                onClick={() => setShowScriptInput(true)}
                                className="w-full py-2 border border-dashed border-zinc-300 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 hover:border-zinc-400 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <Plus size={16} /> Add Negotiation Script
                            </button>
                        ) : (
                            <form onSubmit={handleGenerateScript} className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 bg-white p-3 rounded-lg border border-zinc-200 shadow-sm">
                                <input 
                                    autoFocus
                                    className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-zinc-200"
                                    placeholder="Context (e.g. Supplier, Hiring Staff)..."
                                    value={scriptContextInput}
                                    onChange={e => setScriptContextInput(e.target.value)}
                                />
                                <div className="flex gap-2">
                                   {["Polite", "Assertive", "Professional", "Casual"].map(tone => (
                                       <button 
                                        type="button" 
                                        key={tone} 
                                        onClick={() => setScriptTone(tone)}
                                        className={`px-3 py-1 text-xs rounded-full border ${scriptTone === tone ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200'}`}
                                       >
                                           {tone}
                                       </button>
                                   ))}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowScriptInput(false)} className="p-2 text-zinc-400 hover:text-zinc-600 text-sm">
                                        Cancel
                                    </button>
                                    <button disabled={isGeneratingScript} className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
                                        {isGeneratingScript ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />} Generate
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  const [generatedPlan, setGeneratedPlan] = useState<BusinessPlan | null>(null);

  return (
    <div className="font-sans text-zinc-900 bg-zinc-50 min-h-screen selection:bg-zinc-200">
      {!generatedPlan ? (
        <Hero onPlanGenerated={setGeneratedPlan} />
      ) : (
        <PlanDashboard plan={generatedPlan} onReset={() => setGeneratedPlan(null)} />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);