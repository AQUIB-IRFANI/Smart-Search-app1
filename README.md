Project Title: Smart Embeddings-Based Search App for Contentstack.
A semantic search Marketplace app powered by ContentStack, Pinecone and Hugging Face.

Problem Statement:
Traditional Search app often fail because they only match keywords and don't understand the meaning of what user is searching for.

This App solves that problem by using semantic search, which understands intent and retrieves relevent results even when the exact words don't match.

The features of this Smart semantic Search App are as follows:

- Semantic search using embeddings all-MiniLM-L6-v2
- Contentstack integration (Products, Blogs & Events)
- Real-time updates via webhooks when entries are published
- Marketplace UI with filters & categories

Technologies stack:
- Backend: Node.js + Express
- Frontend: React + Vite
- Database: Pinecone(Vector DB)
- Embedding: Hugging Face(all-MiniLM-L6-v2)
- CMS: ContentStack

This Project works as follows:
1. When the entry is published in Contentstack
2. The Webhook triggers indexing
3. Then backend generates embeddings with Hugging Face (all-MiniLM-L6-v2) which is open-source embedding model
4. Then stores them to the Pinecone Vector DB.
5. Now when users searches in the frontend React UI
6. The backend (Node.js + Express) queries the Pinecone and returns the most relevent results.

Setup Instructions:
1. Clone Repository:
git clone https://github.com/AQUIB-IRFANI/Smart-Search-app1.git
cd smart-search-app

2. Backend setup:
cd backend
npm install

3. Create .env file:
PORT=4000
HF_API_KEY=HF_KEY
PINECONE_API_KEY=pcsk_3oH8Pw_4FWb2B5VuYnvRU35ViUzStmwnjBRRgFJAVGLcV84qXiu554XUBXoURJZ1seGohc
PINECONE_INDEX=smart-search-app
CONTENTSTACK_API_KEY=blt1da551b8739e8e93

4. Run backend & frontend
npm start
npm run dev

Author:
Aquib Muzzammil Irfani
MERN Stack Developer| Software Developer.
