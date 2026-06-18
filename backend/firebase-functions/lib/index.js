"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserDelete = exports.sendSOSAlert = exports.generateInsightSummary = exports.analyzeSentiment = void 0;
const https_1 = require("firebase-functions/v2/https");
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const twilio_1 = __importDefault(require("twilio"));
admin.initializeApp();
/**
 * AI Mood Sentiment Analysis
 * Calls HuggingFace Mental-BERT API to compute sentiment scores, advices and coping recommendations.
 */
exports.analyzeSentiment = (0, https_1.onCall)(async (request) => {
    const { text } = request.data;
    if (!text) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with a "text" string.');
    }
    const hfToken = process.env.HF_API_TOKEN;
    if (!hfToken) {
        console.warn("HF_API_TOKEN is missing in environment variables. Running mock sentiment analysis.");
        return getMockSentiment(text);
    }
    try {
        const hfResponse = await fetch('https://api-inference.huggingface.co/models/mental/mental-bert-base-uncased', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: text }),
        });
        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            console.error("Hugging Face API returned error status:", hfResponse.status, errorText);
            return getMockSentiment(text);
        }
        const raw = await hfResponse.json();
        if (!raw || !raw[0] || raw[0].length === 0) {
            console.warn("Invalid Hugging Face API response structure. Running mock fallback.");
            return getMockSentiment(text);
        }
        const scores = raw[0];
        const labelMap = {
            'LABEL_0': 'negative', 'LABEL_1': 'neutral', 'LABEL_2': 'positive',
        };
        const top = scores.reduce((a, b) => a.score > b.score ? a : b);
        const sentiment = labelMap[top.label] ?? 'neutral';
        const sentimentScore = Math.round(top.score * 100);
        const copingRecommendations = {
            negative: 'Positive Reframing',
            neutral: 'Active Coping',
            positive: 'Planning',
        };
        const adviceMap = {
            positive: "You're doing beautifully. Keep nurturing yourself — your strength shows in every word.",
            neutral: "Take a gentle breath. It's okay to have uncertain days. You're not alone in this.",
            negative: "This sounds really hard, and your feelings are valid. Please reach out to your safety circle. You deserve support.",
        };
        return {
            sentiment,
            sentimentScore,
            sentimentAdvice: adviceMap[sentiment] ?? adviceMap.neutral,
            suggestedCoping: copingRecommendations[sentiment] ?? copingRecommendations.neutral,
        };
    }
    catch (error) {
        console.error("Error calling Hugging Face API:", error);
        return getMockSentiment(text);
    }
});
/**
 * Fallback Mock Sentiment Analyzer (for offline development/tests)
 */
function getMockSentiment(text) {
    const textLower = text.toLowerCase();
    let sentiment = 'neutral';
    let score = 50;
    if (textLower.includes('sad') || textLower.includes('depress') || textLower.includes('cry') || textLower.includes('hurt') || textLower.includes('worry') || textLower.includes('anxious') || textLower.includes('alone') || textLower.includes('scared')) {
        sentiment = 'negative';
        score = 75;
    }
    else if (textLower.includes('happy') || textLower.includes('good') || textLower.includes('joy') || textLower.includes('love') || textLower.includes('great') || textLower.includes('excit') || textLower.includes('calm')) {
        sentiment = 'positive';
        score = 80;
    }
    const copingRecommendations = {
        negative: 'Positive Reframing',
        neutral: 'Active Coping',
        positive: 'Planning',
    };
    const adviceMap = {
        positive: "You're doing beautifully. Keep nurturing yourself — your strength shows in every word. (Mock Mode)",
        neutral: "Take a gentle breath. It's okay to have uncertain days. You're not alone in this. (Mock Mode)",
        negative: "This sounds really hard, and your feelings are valid. Please reach out to your safety circle. You deserve support. (Mock Mode)",
    };
    return {
        sentiment,
        sentimentScore: score,
        sentimentAdvice: adviceMap[sentiment],
        suggestedCoping: copingRecommendations[sentiment],
    };
}
/**
 * Weekly Mood Insights Generator
 */
exports.generateInsightSummary = (0, https_1.onCall)(async (request) => {
    const { weekData } = request.data;
    if (!weekData || weekData.length === 0) {
        return {
            summary: "You don't have enough entries this week. Keep writing to unlock personalized AI reflections.",
            avgScore: 0,
            dominantSentiment: 'mixed'
        };
    }
    const avgScore = Math.round(weekData.reduce((s, d) => s + d.score, 0) / weekData.length);
    const dominantSentiment = weekData.filter(d => d.sentiment === 'negative').length >= 4
        ? 'challenging' : weekData.filter(d => d.sentiment === 'positive').length >= 4
        ? 'positive' : 'mixed';
    const summaries = {
        positive: `This was a genuinely strong week for you. Your average wellness score of ${avgScore} reflects real resilience. You showed up for yourself daily, and that matters more than you know. Keep this momentum — even on harder days ahead, remember how capable you are.`,
        challenging: `This week carried some real weight, and your average score of ${avgScore} reflects that honestly. That doesn't mean anything is wrong with you — it means you're being real about how you feel. Your next step: try one Positive Reframing exercise from your Toolbox today.`,
        mixed: `This week had its ups and downs, which is completely normal. Your average score of ${avgScore} shows you're navigating each day thoughtfully. Mixed weeks often mean growth is happening. Keep journaling — you're building self-awareness that will serve you long-term.`,
    };
    return {
        summary: summaries[dominantSentiment] ?? summaries.mixed,
        avgScore,
        dominantSentiment
    };
});
/**
 * Dispatch SOS alert via Twilio SMS and Voice Calls
 */
exports.sendSOSAlert = (0, https_1.onCall)(async (request) => {
    const { userId } = request.data;
    if (!userId) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with a "userId".');
    }
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;
    const hospitalPhone = process.env.HOSPITAL_PHONE;
    const dbAdmin = admin.firestore();
    // Fetch safety circle contacts
    const guardiansSnap = await dbAdmin.collection('guardians').where('userId', '==', userId).get();
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    const userName = userDoc.data()?.displayName ?? 'A NewMomCircle member';
    const recipients = guardiansSnap.docs.map(d => d.data().phone);
    if (hospitalPhone) {
        recipients.push(hospitalPhone);
    }
    if (recipients.length === 0) {
        console.warn(`No safety guardians configured for user: ${userId}.`);
        return { sent: false, recipientCount: 0, reason: "No safety guardians configured." };
    }
    let sent = false;
    if (twilioSid && twilioAuthToken && twilioFrom) {
        try {
            const twilioClient = (0, twilio_1.default)(twilioSid, twilioAuthToken);
            await Promise.all(recipients.map(async (phone) => {
                // 1. Dispatch SOS text message
                await twilioClient.messages.create({
                    to: phone,
                    from: twilioFrom,
                    body: `🆘 URGENT: ${userName} has triggered an emergency SOS alert on NewMomCircle. Please check on them immediately.`,
                });
                // 2. Dispatch SOS Voice call with synthesized alert
                await twilioClient.calls.create({
                    to: phone,
                    from: twilioFrom,
                    twiml: `<Response><Say voice="alice" language="en-IN">This is an urgent emergency alert from NewMomCircle. ${userName} needs immediate assistance. Please contact them right away.</Say><Pause length="2"/><Say voice="alice" language="en-IN">This message will repeat once.</Say><Pause length="1"/><Say voice="alice" language="en-IN">${userName} needs immediate assistance.</Say></Response>`,
                });
            }));
            sent = true;
        }
        catch (error) {
            console.error("Error sending Twilio SOS notification requests:", error);
        }
    }
    else {
        console.warn("Twilio credentials are not set. Logging mock SOS dispatch.");
        sent = true;
    }
    // Audit trail log write
    await dbAdmin.collection('sosEvents').add({
        userId,
        triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
        recipientCount: recipients.length,
        method: 'button',
        status: sent ? 'sent' : 'mocked',
    });
    return { sent, recipientCount: recipients.length };
});
/**
 * GDPR Auth Delete Trigger: Anonymizes and wipes user information.
 */
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    const dbAdmin = admin.firestore();
    const batch = dbAdmin.batch();
    // 1. Anonymize user profile document
    batch.set(dbAdmin.collection('users').doc(uid), {
        email: `deleted_${uid}@anonymised.com`,
        displayName: 'Deleted User',
        photoURL: null,
        gdprDeleteRequested: true,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    // 2. Query personal logs & community posts
    const [journals, guardians, posts] = await Promise.all([
        dbAdmin.collection('journalEntries').where('userId', '==', uid).get(),
        dbAdmin.collection('guardians').where('userId', '==', uid).get(),
        dbAdmin.collection('posts').where('authorId', '==', uid).get(),
    ]);
    // 3. Purge private files & guardian contacts
    journals.forEach(d => batch.delete(d.ref));
    guardians.forEach(d => batch.delete(d.ref));
    // 4. Anonymize user-created posts to maintain community integrity
    posts.forEach(d => batch.update(d.ref, {
        authorName: 'Anonymous Mom',
        authorId: `anon_${uid}`,
        authorInitials: 'AM',
        photoURL: null
    }));
    // Commit transaction
    await batch.commit();
    console.log(`GDPR cleanup completed for uid: ${uid}`);
});
//# sourceMappingURL=index.js.map