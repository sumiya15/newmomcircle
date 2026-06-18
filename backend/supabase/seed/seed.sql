-- ============================================================
-- NewMomCircle — Seed Data
-- Run AFTER migrations. For development only.
-- ============================================================

-- Sample resources (approved)
INSERT INTO public.resources (title, content, category, language, submitted_by, is_approved)
VALUES
  ('Understanding the Fourth Trimester',
   'The fourth trimester refers to the first 12 weeks after giving birth. During this time, your body is recovering from childbirth and your baby is adjusting to life outside the womb. It''s completely normal to feel overwhelmed, exhausted, and emotional. Rest as much as possible, accept help when offered, and be gentle with yourself.',
   'Postpartum Recovery', 'en', NULL, TRUE),

  ('Signs of Postpartum Depression',
   'Postpartum depression (PPD) affects up to 1 in 5 new mothers. Signs include persistent sadness, difficulty bonding with your baby, changes in appetite or sleep, feelings of worthlessness, and in severe cases, thoughts of harming yourself or your baby. PPD is a medical condition — not a personal failure. Please reach out to your doctor if you recognize these signs.',
   'Mental Health', 'en', NULL, TRUE),

  ('Breastfeeding: A Gentle Guide',
   'Breastfeeding can be challenging in the early weeks. Ensure your baby latches correctly by bringing baby to breast (not breast to baby). Feed on demand — usually every 2-3 hours. Nipple soreness is common but should improve. Contact a lactation consultant if you are struggling — support makes a significant difference.',
   'Feeding', 'en', NULL, TRUE),

  ('Managing Sleep Deprivation',
   'Sleep deprivation is one of the hardest parts of early parenthood. Sleep when your baby sleeps if possible. Share night duties with your partner. Accept help from family. Avoid caffeine after 2pm. Know that this phase is temporary — most babies begin sleeping longer stretches by 4-6 months.',
   'Sleep', 'en', NULL, TRUE),

  ('स्तनपान के बारे में जानकारी',
   'स्तनपान माँ और शिशु दोनों के लिए बहुत फायदेमंद है। पहले कुछ हफ्तों में दर्द और परेशानी हो सकती है। सही तरीके से लैच (latch) करना बहुत जरूरी है। दिन में 8-12 बार स्तनपान कराएं। यदि कोई समस्या हो, तो lactation counselor से सहायता लें।',
   'Feeding', 'hi', NULL, TRUE);
