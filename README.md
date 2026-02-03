# Faceless Video Script Generator

A professional AI-powered platform for generating cinematic, high-quality video scripts for faceless content creators. Built with Next.js 15+ and powered by multiple AI providers including Gemini 2.0, Groq Llama 3.3, OpenAI, and more.

## 🎯 Features

- **Professional Script Generation**: Create sequential 8-second scenes with multi-angle camera directions
- **Multi-AI Integration**: 6 AI providers with intelligent failover system
- **Character Consistency**: Identity anchor system maintains character DNA across all scenes
- **Niche Optimization**: Specialized rules for Car Restoration, Historical Mystery, Animal Cooking, etc.
- **Enterprise-Grade Reliability**: Automatic key rotation and failover for maximum uptime
- **Real-time Monitoring**: API key status dashboard and performance tracking

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd faceless-video-generator
npm install --legacy-peer-deps
```

### 2. Environment Setup

Copy the example environment file and add your API keys:

```bash
cp .env.example .env.local
```

### 3. Configure API Keys

Add multiple API keys for each provider in your `.env.local`:

```env
# Gemini API Keys (Primary)
GEMINI_API_KEY=your_gemini_key_1
GEMINI_API_KEY_1=your_gemini_key_2
GEMINI_API_KEY_2=your_gemini_key_3

# Groq API Keys (Fast inference)
GROQ_API_KEY=your_groq_key_1
GROQ_API_KEY_1=your_groq_key_2

# OpenAI API Keys
OPENAI_API_KEY=your_openai_key_1
OPENAI_API_KEY_1=your_openai_key_2

# Add more keys as needed...
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the platform.

## 🔑 API Key Management

### Multiple Keys Per Provider

The system supports multiple API keys per provider for:
- **Load Balancing**: Distribute requests across keys
- **Failover Protection**: Automatic switching when keys fail
- **Rate Limit Avoidance**: Rotate keys to prevent hitting limits

### Key Naming Convention

```env
# Base key
PROVIDER_API_KEY=key1

# Additional keys
PROVIDER_API_KEY_1=key2
PROVIDER_API_KEY_2=key3
PROVIDER_API_KEY_3=key4
```

### Intelligent Failover System

1. **User Choice Priority**: If user selects a provider, only that provider's keys are used
2. **Key Rotation**: Failed keys are marked and avoided for future requests
3. **Automatic Recovery**: Failed keys are retested after cooldown period
4. **Fallback Chain**: If preferred provider fails, system falls back to other providers

## 📊 Monitoring

### API Key Status Dashboard

Visit `/api/key-status` to check:
- Total keys per provider
- Working vs failed keys
- Health percentage
- Last failure timestamps

### Real-time Monitoring

The dashboard shows:
- Provider health status
- Key rotation statistics
- Error rates and patterns
- Performance metrics

## 🛠️ AI Providers

| Provider | Models | Use Case |
|----------|--------|----------|
| **Gemini 2.0** | gemini-2.0-flash | Primary script generation |
| **Groq** | llama-3.3-70b-versatile | Fast inference |
| **OpenAI** | gpt-4o | High-quality fallback |
| **OpenRouter** | Multiple models | Model variety |
| **GitHub Models** | Meta-Llama-3.1-405B | Enterprise access |
| **Deapi** | llama-3.3-70b-instruct | Alternative provider |

## 🎬 Script Generation

### Supported Niches

- **Car Restoration**: Logical restoration workflow
- **Historical Mystery**: Suspense with Chiaroscuro lighting
- **Animal Village Cooking**: Multi-character coordination
- **Monkey Village Cooking**: ASMR jungle kitchen
- **Mayajal Style**: High-engagement mystery facts

### Key Features

- **8-second scenes** with 3-4 camera angles each
- **Character DNA locks** for consistency
- **Seamless transitions** between scenes
- **Professional narration** in multiple languages
- **Ultra-realistic CGI** specifications

## 🔧 Development

### Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── faceless-script/ # Main script generator
│   │   ├── key-status/      # Key monitoring
│   │   └── ...             # Other tools
│   └── dashboard/          # Dashboard pages
├── components/
│   ├── dashboard/          # Dashboard components
│   ├── sections/           # Landing page sections
│   └── ui/                # UI components
└── lib/
    └── ai.ts              # AI client management
```

### Adding New Providers

1. Add keys to environment variables
2. Update `getKeys()` function in `src/lib/ai.ts`
3. Create client function following existing patterns
4. Add to provider rotation list

## 📈 Performance

### Optimization Features

- **Batch Generation**: Process multiple scenes efficiently
- **Smart Caching**: Reduce redundant API calls
- **Key Rotation**: Prevent rate limiting
- **Parallel Processing**: Handle multiple requests
- **Graceful Degradation**: Partial results when possible

### Monitoring Endpoints

- `GET /api/key-status` - Check API key health
- `POST /api/faceless-script` - Generate scripts
- Dashboard analytics for usage patterns

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set:

```bash
# Check key status
curl http://localhost:3000/api/key-status
```

### Production Considerations

- Use multiple keys per provider for redundancy
- Monitor key usage and rotation
- Set up alerts for provider failures
- Regular key health checks

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for content creators who demand professional quality.**
#
