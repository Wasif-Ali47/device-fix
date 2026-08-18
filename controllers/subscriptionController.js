const activeStatuses = new Set(["active", "trialing", "paid"]);

const buildSubscriptionStatus = (user) => {
  const subscription = user?.subscription || {};
  const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
  const hasActiveExpiry = expiresAt instanceof Date && !Number.isNaN(expiresAt.valueOf())
    ? expiresAt.getTime() > Date.now()
    : false;
  const status = subscription.status || (user?.isPro ? "active" : "free");
  const isPro = Boolean(user?.isPro || activeStatuses.has(status) || hasActiveExpiry);

  return {
    isPro,
    plan: subscription.plan || (isPro ? "premium" : "free"),
    status,
    platform: subscription.platform || "",
    productId: subscription.productId || "",
    expiresAt: subscription.expiresAt || null,
  };
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    return res.json({
      success: true,
      subscription: buildSubscriptionStatus(req.user),
    });
  } catch (error) {
    console.error("[subscription:getStatus] error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription status",
      error: error.message,
    });
  }
};
