# LLM Lab Frontend

A beautiful, modern frontend application for experimenting with LLM parameters and comparing responses.

## Features

### Main Page
- **Experiment List**: View all your experiments with their status, completion progress, and best responses
- **Create Experiment**: Easy-to-use dialog to create new experiments with custom parameters and realtime updates
- **Beautiful UI**: Built with shadcn/ui components following modern design principles

### Experiment Details Page
- **Comprehensive Comparison Table**: Compare all responses side-by-side
- **Detailed Metrics**: View scores for coherence, completeness, relevancy, and overall quality
- **Ranking System**: Responses automatically ranked by overall score with best response highlighted
- **Parameter Details**: See exact temperature and top-P values used for each response

## Technology Stack

- **Next.js 15.5.6**: React framework with App Router
- **React 19**: Latest React with Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS v4**: Modern utility-first CSS
- **shadcn/ui**: Beautiful, accessible component library
- **Lucide React**: Icon library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running (default: http://localhost:3001)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.local.example .env.local
```

3. Update the API URL in `.env.local` if your backend is running on a different port:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## API Integration

The frontend connects to the backend API using the following endpoints:

- `GET /api/experiments` - Fetch all experiments
- `GET /api/experiments/:id/metrics` - Fetch metrics for the experiment
- `POST /api/experiments` - Create new experiment
- `GET /api/experiments/:id/export` - Export the metrics in CSV or JSON format

## Component Structure

```
src/
├── app/
│   ├── experiments/[id]/page.tsx  # Details page
│   ├── lib/
│   │   └── api.ts                 # API client
│   ├── page.tsx                   # Main page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
├── components/
│   ├── experiments/
│   │   ├── create-experiment-dialog.tsx
│   │   ├── export-buttons.tsx
│   │   └── experiment-card.tsx
│   └── ui/                        # shadcn components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       └── ...
└── types/
    └── experiment.ts              # TypeScript types
```

## Features in Detail

### Create Experiment Dialog
- Input prompt (up to 500 characters)
- Configure temperature values (0-2, max 5 values)
- Configure top-P values (0-1, max 5 values)
- Automatic validation
- Error handling

### Experiment Cards
- Status badges with icons (Pending, Processing, Completed, Failed)
- Progress indicator (completed/total responses)
- Average score display
- Best response preview with parameters
- Quick navigation to details page

### Comparison Table
- Trophy icon for best response
- Color-coded scores (green/yellow/red)
- Response preview with line clamping
- Parameter details for reproduction
- Latency metrics

## Design Principles

- **Consistent**: Uses shadcn/ui design system throughout
- **Accessible**: Semantic HTML and ARIA labels
- **Responsive**: Mobile-first design with responsive grid layouts
- **Modern**: Clean, minimalist interface with subtle animations
- **Informative**: Clear status indicators and comprehensive metrics

## Theme

The application uses the shadcn "new-york" style with a neutral color palette:
- Light mode: Clean white backgrounds with subtle grays
- Dark mode: Deep blacks with high contrast (automatically supported)

## Troubleshooting

### API Connection Issues
- Ensure backend is running on the correct port
- Check CORS configuration in backend
- Verify `.env.local` has correct `NEXT_PUBLIC_API_URL`

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)

## Future Enhancements

- Export experiment results to CSV/JSON
- Dark mode toggle
- Experiment filtering and search
