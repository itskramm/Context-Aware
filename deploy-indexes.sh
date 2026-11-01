#!/bin/bash

# Deploy Firestore indexes to Firebase
# This script deploys the indexes defined in backend/firestore.indexes.json

set -e

echo "🚀 Deploying Firestore indexes to contextaware-507ad..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install it with:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  Not logged in to Firebase. Running login..."
    firebase login
fi

# Deploy indexes
echo "📤 Deploying indexes..."
firebase deploy --only firestore:indexes --project contextaware-507ad

echo ""
echo "✅ Indexes deployed successfully!"
echo ""
echo "📊 Check index build status at:"
echo "   https://console.firebase.google.com/project/contextaware-507ad/firestore/indexes"
echo ""
echo "⏱️  Indexes typically take 2-5 minutes to build."
echo "   Once status shows 'Enabled', try uploading a new file!"
