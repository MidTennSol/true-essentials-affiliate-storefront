# True Essentials - Affiliate Storefront

A modern, AI-powered affiliate marketing storefront built with Astro, featuring automated content generation and seamless product management.

## ✨ Features

### 🎯 **Core Functionality**
- **Professional Storefront**: Responsive product catalog with modern design
- **Admin Interface**: Password-protected product management dashboard
- **AI Content Generation**: Automated product titles and descriptions using OpenAI
- **Airtable Integration**: Cloud database for product storage and management
- **Amazon Affiliate Processing**: Automatic ASIN extraction and affiliate URL generation

### 🚀 **Technical Highlights**
- **Frontend**: Astro with TypeScript for optimal performance
- **SEO Optimized**: Meta tags, structured data, and social media integration
- **Mobile-First**: Responsive design optimized for all devices
- **Performance**: Lazy loading images and optimized assets
- **Security**: Protected admin routes with session management

### 🛠️ **Admin Features**
- Single product addition with AI content generation
- Bulk product import interface (URL parsing ready)
- Product management dashboard with statistics
- Real-time content generation with fallback systems

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Airtable account and API key
- OpenAI API key (optional, has fallbacks)
- Amazon Associates account for affiliate tag

### 1. Installation

```bash
git clone <your-repo-url>
cd true-essentials-aff
npm install
```

### 2. Environment Setup

Copy the example environment file:
```bash
cp env.config.example .env
```

Configure your environment variables in `.env`:
```env
# Required - Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here

# Required - Admin Access
ADMIN_PASSWORD=your_secure_admin_password_here

# Required - Amazon Affiliate
AFFILIATE_TAG=yourtag-20

# Optional - AI Content Generation
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Airtable Setup

Create an Airtable base with the following table structure:

**Table Name**: `Affiliate Products`

| Field Name    | Field Type           | Description              |
|---------------|----------------------|--------------------------|
| Title         | Single Line Text     | Product name             |
| Description   | Long Text            | Product description      |
| Image URL     | URL                  | Product image            |
| Slug          | Formula              | URL-friendly identifier  |
| Affiliate URL | URL                  | Amazon affiliate link    |
| Created At    | Created Time         | Tracking                 |

**Slug Formula**: `REGEX_REPLACE(LOWER(SUBSTITUTE(Title, " ", "-")), "[^a-z0-9-]", "")`

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:4321` to see your storefront!

## 📁 Project Structure

```
true-essentials-aff/
├── public/                 # Static assets
│   ├── favicon.svg
│   ├── robots.txt         # SEO crawler guidance
│   └── sitemap.xml        # Search engine sitemap
├── src/
│   ├── lib/               # Utility libraries
│   │   ├── airtable.ts    # Database operations
│   │   ├── amazon.ts      # Amazon URL processing
│   │   └── content.ts     # AI content generation
│   ├── pages/             # Astro pages (auto-routing)
│   │   ├── index.astro    # Home page
│   │   ├── products/      # Product pages
│   │   │   ├── index.astro     # Product listing
│   │   │   └── [slug].astro    # Dynamic product details
│   │   ├── admin/         # Admin interface
│   │   │   ├── index.astro     # Dashboard
│   │   │   ├── add-product.astro # Single product form
│   │   │   └── bulk-add.astro   # Bulk import interface
│   │   └── test.astro     # Development utilities
│   └── env.d.ts           # TypeScript environment types
├── astro.config.mjs       # Astro configuration
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔧 Usage

### Admin Access
1. Visit `/admin` 
2. Enter your admin password
3. Use the dashboard to manage products

### Adding Products
1. **Single Product**: Use `/admin/add-product` to add one product at a time
2. **Bulk Import**: Use `/admin/bulk-add` for multiple products (parsing ready)

### Product Workflow
1. **Input**: Amazon product URL
2. **Processing**: ASIN extraction → Affiliate URL generation → AI content creation
3. **Storage**: Save to Airtable with auto-generated slug
4. **Display**: Automatically appears in storefront

## 🌐 Deployment

### Vercel (Recommended)

1. **GitHub Integration**: Push your code to GitHub
2. **Vercel Setup**: Connect your GitHub repo to Vercel
3. **Environment Variables**: Add all environment variables in Vercel dashboard
4. **Deploy**: Automatic deployment on every push to main branch

### Environment Variables for Deployment
Make sure to set these in your deployment platform:
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID` 
- `ADMIN_PASSWORD`
- `AFFILIATE_TAG`
- `OPENAI_API_KEY` (optional)

## 🧞 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## 🔍 SEO Features

- **Meta Tags**: Comprehensive Open Graph and Twitter Card support
- **Structured Data**: JSON-LD schema for products and organization
- **Sitemap**: Auto-generated XML sitemap
- **Performance**: Optimized images with lazy loading
- **Mobile**: Responsive design with proper viewport handling

## 🛡️ Security Features

- **Admin Protection**: Session-based authentication for admin routes
- **Environment Security**: Sensitive data in environment variables
- **CSRF Protection**: Secure form handling
- **Robots.txt**: Proper crawler guidance protecting admin areas

## 🔗 API Integrations

### Airtable
- Full CRUD operations for product management
- Real-time data synchronization
- Type-safe TypeScript interfaces

### OpenAI
- GPT-3.5-turbo for content generation
- Specialized prompts for affiliate marketing
- Graceful fallbacks when API unavailable

### Amazon
- ASIN extraction from various URL formats
- Affiliate URL generation with proper tagging
- Image URL construction for product display

## 🐛 Troubleshooting

### Common Issues

**Q: Products not loading?**
A: Check your Airtable API key and base ID in environment variables.

**Q: AI content not generating?**
A: Verify your OpenAI API key, or use without it (fallback content will be used).

**Q: Admin login not working?**
A: Ensure ADMIN_PASSWORD is set in your environment variables.

**Q: Affiliate links not working?**
A: Verify your AFFILIATE_TAG is correctly formatted (should end with -20).

### Development Testing
Visit `/test` for utility testing of all integrations and functions.

## 📝 License

MIT License - feel free to use this project as a starting point for your own affiliate storefront!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the `/test` page for debugging utilities
3. Open an issue on GitHub

---

**Built with ❤️ using [Astro](https://astro.build) and modern web technologies.**
