# testID Instrumentation Report

**Project:** NewMomCircle — React Native / Expo mobile app  
**Purpose:** Add `testID` props to every interactive and key UI element for Appium E2E tests using the `~testID` (accessibility ID) selector convention  
**Convention:** All testIDs are lowercase kebab-case strings  
**Total files modified:** 29 screen files + 1 shared component  

---

## Rules Applied

- Added `testID` to: `TextInput`, `Pressable`, `TouchableOpacity`, `Button`, outer `ScrollView`, `FlatList`, `SectionList`, main screen root `View`, and key `Text` elements (titles, error messages, badges)
- Did **not** add `testID` to purely decorative `View`s, SVG elements, `StyleSheet` objects, or style-only components
- Sub-components that wrap interactive elements (`SocialButton`, `LanguageCard`, `SettingsRow`, `StatPill`, `TapRow`, `ToggleRow`) were updated to accept and forward a `testID` prop

---

## Shared Component

### `apps/mobile/components/primitives/Input.tsx`
- Added `testID?: string` to the `Props` interface
- Forwarded `testID` to the inner `<TextInput>` element
- Enables all auth screens using `<Input testID="...">` to pass testID to the native element

---

## Auth Screens

### `apps/mobile/app/(auth)/login.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `login-screen` |
| `<ScrollView>` | `login-scroll` |
| Email `<Input>` | `login-email-input` |
| Password `<Input>` | `login-password-input` |
| Forgot password `<Pressable>` | `login-forgot-link` |
| Error banner `<MotiView>` | `login-error-banner` |
| Submit `<Pressable>` | `login-submit-btn` |
| Apple `SocialButton` | `login-apple-btn` |
| Google `SocialButton` | `login-google-btn` |
| Signup link `<Pressable>` | `login-signup-link` |

### `apps/mobile/app/(auth)/signup.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `signup-screen` |
| `<ScrollView>` | `signup-scroll` |
| Full Name `<Input>` | `signup-name-input` |
| Email `<Input>` | `signup-email-input` |
| Password `<Input>` | `signup-password-input` |
| Confirm Password `<Input>` | `signup-confirm-input` |
| Error banner `<MotiView>` | `signup-error-banner` |
| Submit `<Pressable>` | `signup-submit-btn` |
| Apple `SocialButton` | `signup-apple-btn` |
| Google `SocialButton` | `signup-google-btn` |
| Login link `<Pressable>` | `signup-login-link` |

### `apps/mobile/app/(auth)/forgot-password.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `forgot-screen` |
| Back `<Pressable>` | `forgot-back-btn` |
| Success state `<MotiView>` | `forgot-success-msg` |
| Back to login (success) `<Pressable>` | `forgot-back-to-login-btn` |
| Email `<Input>` | `forgot-email-input` |
| Submit `<Pressable>` | `forgot-submit-btn` |
| Back to login (form) `<Pressable>` | `forgot-back-link` |

---

## Onboarding Screens

### `apps/mobile/app/onboarding/splash.tsx`
| Element | testID |
|---|---|
| Root `<Pressable>` | `splash-screen` |

### `apps/mobile/app/onboarding/language.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `language-screen` |
| `<ScrollView>` | `language-scroll` |
| English card | `language-en-btn` |
| Hindi card | `language-hi-btn` |
| Telugu card | `language-te-btn` |
| Tamil card | `language-ta-btn` |
| Kannada card | `language-kn-btn` |
| Continue `<TouchableOpacity>` | `language-continue-btn` |

### `apps/mobile/app/onboarding/quiz.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `quiz-screen` |
| Back `<Pressable>` | `quiz-back-btn` |
| Progress bar `<View>` | `quiz-progress-bar` |
| CTA `<Pressable>` (conditional) | `quiz-next-btn` / `quiz-submit-btn` |

### `apps/mobile/app/onboarding/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `onboarding-screen` |
| Skip `<Pressable>` | `onboarding-skip-btn` |
| Get Started `<Pressable>` (last slide) | `onboarding-get-started-btn` |

---

## Feed Screens

### `apps/mobile/app/(main)/feed/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `feed-screen` |
| `<FlatList>` | `feed-list` |
| FAB `<Pressable>` | `feed-create-btn` |
| Explore `<Pressable>` | `feed-explore-btn` |
| Messages `<Pressable>` | `feed-messages-btn` |
| Tracker `<Pressable>` | `feed-tracker-btn` |
| Notification bell `<Pressable>` | `feed-notification-btn` |
| Search bar `<Pressable>` | `feed-search-btn` |
| Modal post `<TextInput>` | `feed-post-input` |
| Modal submit `<Pressable>` | `feed-submit-btn` |

### `apps/mobile/app/(main)/feed/[id].tsx`
| Element | testID |
|---|---|
| Root `<View>` | `post-detail-screen` |
| Back `<Pressable>` | `post-detail-back-btn` |
| `<FlatList>` (comments) | `post-detail-comments-list` |
| Like `<Pressable>` | `post-detail-like-btn` |
| Comment `<TextInput>` | `post-detail-comment-input` |
| Send `<Pressable>` | `post-detail-comment-submit-btn` |

### `apps/mobile/app/(main)/feed/create.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `create-post-screen` |
| Cancel `<Pressable>` | `create-post-back-btn` |
| Post submit `<Pressable>` | `create-post-submit-btn` |
| Content `<TextInput>` | `create-post-content-input` |
| Category picker `<Pressable>` | `create-post-category-picker` |
| Anonymous toggle `<Pressable>` | `create-post-anonymous-toggle` |

---

## Journal Screens

### `apps/mobile/app/(main)/journal/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `journal-screen` |
| New entry `<TouchableOpacity>` | `journal-new-btn` |
| Entries `<FlatList>` | `journal-entries-list` |
| Content `<TextInput>` | `journal-content-input` |
| Save `<TouchableOpacity>` | `journal-submit-btn` |

### `apps/mobile/app/(main)/journal/insights.tsx`
| Element | testID |
|---|---|
| Root `<ScrollView>` | `insights-screen` |
| Bar chart `<View>` | `insights-bar-chart` |
| Advice card `<View>` | `insights-advice-card` |

---

## Explore Screens

### `apps/mobile/app/(main)/explore/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `explore-screen` |
| Search `<TextInput>` | `explore-search-input` |
| Circles `<FlatList>` | `explore-circles-list` |

### `apps/mobile/app/(main)/explore/[id].tsx`
| Element | testID |
|---|---|
| Root `<View>` | `circle-detail-screen` |
| Back `<Pressable>` | `circle-detail-back-btn` |
| Join/Leave `<Pressable>` | `circle-join-btn` |
| Tab `<Pressable>` (each) | `circle-posts-tab`, `circle-members-tab`, `circle-about-tab` |

---

## Tracker Screen

### `apps/mobile/app/(main)/tracker/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `tracker-screen` |
| Timeline `<ScrollView>` | `tracker-log-list` |
| FAB `<Pressable>` | `tracker-fab-btn` |
| Log type cell `<Pressable>` (each) | `tracker-add-{type}-btn` (e.g. `tracker-add-feed-btn`) |

---

## Messages Screens

### `apps/mobile/app/(main)/messages/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `messages-screen` |
| Compose `<Pressable>` | `messages-compose-btn` |
| Search `<TextInput>` | `messages-search-input` |
| Conversations `<FlatList>` | `messages-list` |

### `apps/mobile/app/(main)/messages/[id].tsx`
| Element | testID |
|---|---|
| Root `<View>` | `chat-screen` |
| Back `<Pressable>` | `chat-back-btn` |
| Messages `<FlatList>` | `chat-messages-list` |
| Message `<TextInput>` | `chat-message-input` |
| Send `<Pressable>` | `chat-send-btn` |

---

## Notifications Screen

### `apps/mobile/app/(main)/notifications/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `notifications-screen` |
| Mark all read `<Pressable>` | `notifications-mark-all-btn` |
| `<SectionList>` | `notifications-list` |

---

## Profile Screens

### `apps/mobile/app/(main)/profile/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `profile-screen` |
| Settings `<Pressable>` | `profile-settings-btn` |
| Edit avatar `<Pressable>` | `profile-edit-btn` |
| Name `<Text>` | `profile-name-text` |
| Sign Out `SettingsRow` | `profile-logout-btn` |

### `apps/mobile/app/(main)/profile/edit.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `edit-profile-screen` |
| Back `<Pressable>` | `edit-profile-back-btn` |
| Save (header) `<Pressable>` | `edit-profile-save-header-btn` |
| Error dismiss `<Pressable>` | `edit-profile-error-dismiss` |
| Avatar `<Pressable>` | `edit-profile-avatar-btn` |
| `<ScrollView>` | `edit-profile-scroll` |
| Display Name `<TextInput>` | `edit-profile-name-input` |
| Bio `<TextInput>` | `edit-profile-bio-input` |
| City `<TextInput>` | `edit-profile-city-input` |
| Baby Name `<TextInput>` | `edit-profile-baby-name-input` |
| Baby DOB `<TextInput>` | `edit-profile-baby-dob-input` |
| Stage chip `<Pressable>` (each) | `edit-profile-stage-{id}-btn` |
| Topic chip `<Pressable>` (each) | `edit-profile-topic-{slug}-btn` |
| Save bar `<Pressable>` | `edit-profile-save-btn` |

### `apps/mobile/app/(main)/profile/settings.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `settings-screen` |
| Back `<Pressable>` | `settings-back-btn` |
| `<ScrollView>` | `settings-scroll` |
| Push Notifications `Switch` | `settings-push-notifications-toggle` |
| Email Digest `Switch` | `settings-email-digest-toggle` |
| Activity Alerts `Switch` | `settings-activity-alerts-toggle` |
| Circle Updates `Switch` | `settings-circle-updates-toggle` |
| Visibility Public `<Pressable>` | `settings-visibility-public-btn` |
| Visibility Circles `<Pressable>` | `settings-visibility-circles-btn` |
| Visibility Private `<Pressable>` | `settings-visibility-private-btn` |
| Show Baby Age `Switch` | `settings-show-baby-age-toggle` |
| Allow DMs `Switch` | `settings-allow-dms-toggle` |
| Read Receipts `Switch` | `settings-read-receipts-toggle` |
| AI Personalisation `Switch` | `settings-ai-personalisation-toggle` |
| Download My Data `<Pressable>` | `settings-download-data-btn` |
| Privacy Policy `<Pressable>` | `settings-privacy-policy-btn` |
| Terms of Service `<Pressable>` | `settings-terms-btn` |
| Open Source Licenses `<Pressable>` | `settings-licenses-btn` |
| Send Feedback `<Pressable>` | `settings-feedback-btn` |

---

## Resources Screens

### `apps/mobile/app/(main)/resources/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `resources-screen` |
| Search toggle `<Pressable>` | `resources-search-toggle` |
| Search `<TextInput>` | `resources-search-input` |
| Clear search `<Pressable>` | `resources-search-clear-btn` |
| Category chip `<Pressable>` (each) | `resources-cat-{slug}-btn` |
| Articles `<FlatList>` | `resources-list` |
| Events banner `<Pressable>` | `resources-events-banner-btn` |
| Featured article `<Pressable>` | `resources-featured-article-btn` |
| Featured bookmark `<Pressable>` | `resources-featured-bookmark-btn` |
| Article card `<Pressable>` (each) | `resources-article-{id}-btn` |
| Article bookmark `<Pressable>` (each) | `resources-bookmark-{id}-btn` |

### `apps/mobile/app/(main)/resources/[id].tsx`
| Element | testID |
|---|---|
| Root `<View>` | `article-detail-screen` |
| Back `<Pressable>` | `article-detail-back-btn` |
| Bookmark `<Pressable>` | `article-detail-bookmark-btn` |
| `<RNAnimated.ScrollView>` | `article-detail-scroll` |
| Like `<Pressable>` | `article-detail-like-btn` |
| Share (engagement row) `<Pressable>` | `article-detail-share-btn` |
| Share bar `<Pressable>` | `article-detail-share-bar-btn` |
| Related card `<Pressable>` (each) | `article-related-{id}-btn` |

### `apps/mobile/app/(main)/resources/events.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `events-screen` |
| Back `<Pressable>` | `events-back-btn` |
| City picker `<Pressable>` | `events-city-picker` |
| City option `<Pressable>` (each) | `events-city-{slug}-btn` |
| Filter pill `<Pressable>` (each) | `events-filter-{slug}-btn` |
| Events `<FlatList>` | `events-list` |
| RSVP `<Pressable>` (each) | `events-rsvp-{id}-btn` |

---

## Search Screen

### `apps/mobile/app/(main)/search/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `search-screen` |
| Back `<Pressable>` | `search-back-btn` |
| Search `<TextInput>` | `search-input` |
| Clear query `<Pressable>` | `search-clear-btn` |
| Browse `<ScrollView>` (empty state) | `search-browse-scroll` |
| Trending chip `<Pressable>` (each) | `search-trending-{slug}-btn` |
| Clear recent `<Pressable>` | `search-clear-recent-btn` |
| Recent row `<Pressable>` (each) | `search-recent-{slug}-btn` |
| Posts tab `<Pressable>` | `search-tab-posts` |
| People tab `<Pressable>` | `search-tab-people` |
| Circles tab `<Pressable>` | `search-tab-circles` |
| Follow `<Pressable>` (each) | `search-follow-{id}-btn` |
| Join circle `<Pressable>` (each) | `search-join-{id}-btn` |

---

## Safety Screen

### `apps/mobile/app/(main)/safety/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `safety-screen` |
| SOS `<TouchableOpacity>` | `safety-sos-btn` |
| Add guardian `<TouchableOpacity>` | `safety-add-guardian-btn` |
| Delete guardian `<TouchableOpacity>` (each) | `safety-delete-guardian-{id}-btn` |
| Confirm delete `<TouchableOpacity>` | `safety-confirm-delete-btn` |
| Cancel delete `<TouchableOpacity>` | `safety-cancel-delete-btn` |
| SOS cancel `<TouchableOpacity>` | `safety-sos-cancel-btn` |
| Guardian name `<TextInput>` | `safety-guardian-name-input` |
| Guardian phone `<TextInput>` | `safety-guardian-phone-input` |
| Guardian relationship `<TextInput>` | `safety-guardian-relationship-input` |
| Save guardian `<TouchableOpacity>` | `safety-save-guardian-btn` |
| Cancel modal `<TouchableOpacity>` | `safety-cancel-guardian-btn` |

---

## Toolbox Screen

### `apps/mobile/app/(main)/toolbox/index.tsx`
| Element | testID |
|---|---|
| Root `<View>` | `toolbox-screen` |
| Tab pill `<TouchableOpacity>` (each) | `toolbox-tab-breath-btn`, `toolbox-tab-affirm-btn`, `toolbox-tab-ground-btn`, `toolbox-tab-joke-btn` |
| `<ScrollView>` | `toolbox-scroll` |
| Breathing start/stop `<TouchableOpacity>` | `toolbox-breath-btn` |
| Next affirmation `<TouchableOpacity>` | `toolbox-next-affirmation-btn` |
| Next joke `<TouchableOpacity>` | `toolbox-next-joke-btn` |

---

## Repository

GitHub: [https://github.com/sumiya15/newmomcircle](https://github.com/sumiya15/newmomcircle)

## Appium Usage

All testIDs can be targeted in Appium using the accessibility ID strategy:

```js
// WebdriverIO example
const el = await $('~login-submit-btn');
await el.click();

// Dynamic testIDs (articles, events, etc.)
const article = await $('~resources-article-a1-btn');
```
