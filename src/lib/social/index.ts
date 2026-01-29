// Twitter exports with namespace
export {
  parseTipCommand as parseTwitterTipCommand,
  generatePaymentLink as generateTwitterPaymentLink,
  createTipCommand as createTwitterTipCommand,
  generateBotReply as generateTwitterBotReply,
  generateConfirmationTweet,
  validateOAuthCallback as validateTwitterOAuthCallback,
  fetchTwitterUser,
  verifyTwitterOwnership,
  generateOAuthUrl as generateTwitterOAuthUrl,
  checkRateLimit as checkTwitterRateLimit,
  type TwitterUser,
  type TwitterTipCommand,
  type TwitterOAuthTokens,
} from "./twitter";

// YouTube exports with namespace
export {
  parseTipCommand as parseYouTubeTipCommand,
  generatePaymentLink as generateYouTubePaymentLink,
  createTipCommand as createYouTubeTipCommand,
  generateBotReply as generateYouTubeBotReply,
  validateOAuthCallback as validateYouTubeOAuthCallback,
  fetchChannel,
  fetchVideoChannel,
  verifyChannelOwnership,
  generateOAuthUrl as generateYouTubeOAuthUrl,
  generateDescriptionSnippet,
  checkRateLimit as checkYouTubeRateLimit,
  type YouTubeChannel,
  type YouTubeTipCommand,
  type YouTubeOAuthTokens,
} from "./youtube";
