# DarkTip

**Privacy-preserving tipping platform for content creators using Zero-Knowledge proofs on Solana.**

DarkTip enables supporters to tip creators completely anonymously while still being able to prove their support for exclusive perks. Built with privacy as the foundation.

## Features

### For Supporters
- **Anonymous Tipping** - Send tips without revealing your wallet address or identity
- **ZK Proof of Support** - Generate cryptographic proofs to access perks without revealing amounts
- **Encrypted Messages** - Send private messages with your tips
- **Multiple Privacy Levels** - Choose from fast to maximum privacy based on your needs
- **Social Integration** - Tip directly from Twitter replies and YouTube comments

### For Creators
- **Privacy-First Dashboard** - See aggregate stats without individual donor data
- **Milestone Funding** - Set goals with escrow-protected funds
- **Supporter Perks** - Create tier-based perks verified by ZK proofs
- **Social Verification** - Connect Twitter and YouTube for easy discovery
- **Low Fees** - Only 2.5% platform fee vs 5-12% on traditional platforms

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, React 18, TailwindCSS
- **Blockchain**: Solana, Anchor Framework
- **Privacy**: Privacy Cash SDK, Stealth Addresses, Encrypted Messaging
- **ZK Proofs**: Noir circuits for proof generation
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand, TanStack Query
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Solana wallet (Phantom, Backpack, or Solflare)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/darktip.git
cd darktip

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Social APIs (optional for development)
TWITTER_CLIENT_ID=your_twitter_client_id
YOUTUBE_API_KEY=your_youtube_api_key
```

## Project Structure

```
/darktip
├── /src
│   ├── /app                 # Next.js App Router pages
│   │   ├── /                # Landing page
│   │   ├── /creators        # Browse creators
│   │   ├── /creator/[id]    # Creator profile
│   │   ├── /dashboard       # Creator dashboard
│   │   ├── /grants          # Milestone grants
│   │   └── /api             # API routes
│   ├── /components
│   │   ├── /ui              # Base UI components
│   │   ├── /tip             # Tipping components
│   │   ├── /creator         # Creator components
│   │   ├── /wallet          # Wallet components
│   │   └── /layout          # Layout components
│   ├── /lib
│   │   ├── /privacy         # Privacy Cash + encryption
│   │   ├── /zk              # ZK proof generation
│   │   ├── /solana          # Solana integration
│   │   ├── /social          # Twitter/YouTube APIs
│   │   └── /supabase        # Database client
│   ├── /contracts           # Solana program interfaces
│   ├── /store               # Zustand stores
│   ├── /hooks               # Custom React hooks
│   ├── /types               # TypeScript types
│   └── /config              # Configuration
├── /public                  # Static assets
└── /tests                   # Test files
```

## Privacy Architecture

### Stealth Addresses
Each tip generates a unique stealth address that only the creator can derive the private key for. This breaks the link between sender and recipient wallets.

### Amount Obfuscation
Tip amounts are encrypted using the creator's public key. Only aggregate statistics are visible.

### Multi-Hop Routing
Higher privacy levels route transactions through multiple hops with mixing for enhanced anonymity.

### ZK Proofs
Supporters can generate Zero-Knowledge proofs to verify their support tier without revealing:
- Their wallet address
- Exact tip amounts
- Tip timestamps

## Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # TypeScript check
npm run test          # Run tests
```

## API Reference

### POST /api/tips
Create a new anonymous tip.

### GET /api/creators
List all creators with filtering and pagination.

### POST /api/auth/login
Authenticate with wallet signature.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

Found a vulnerability? Please email security@darktip.xyz instead of creating a public issue. See [SECURITY.md](.github/SECURITY.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- Website: [darktip.xyz](https://darktip.xyz)
- Twitter: [@darktip](https://twitter.com/darktip)
- Discord: [discord.gg/darktip](https://discord.gg/darktip)
- Documentation: [docs.darktip.xyz](https://docs.darktip.xyz)
