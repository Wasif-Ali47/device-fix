import {
  addKnowledgeEntriesBulk,
  addKnowledgeEntry,
  countKnowledgeEntries,
  deactivateKnowledgeEntry,
  deleteKnowledgeEntry,
  getKnowledgeCategories,
  getKnowledgeEntry,
  getKnowledgeStats,
  getMergedKnowledgeText,
  listKnowledgeEntries,
  reactivateKnowledgeEntry,
  updateKnowledgeEntry,
} from "../services/knowledgeStoreService.js";

export async function listEntries(req, res) {
  try {
    const { category, search, active, limit = 50, skip = 0 } = req.query;
    const opts = {
      category: category || undefined,
      search: search || undefined,
      limit: Math.min(Number(limit) || 50, 200),
      skip: Number(skip) || 0,
    };

    if (active === "all") opts.active = undefined;
    else if (active === "false") opts.active = false;
    else opts.active = true;

    const [entries, total] = await Promise.all([
      listKnowledgeEntries(opts),
      countKnowledgeEntries(opts),
    ]);

    return res.json({ success: true, count: entries.length, total, entries });
  } catch (error) {
    console.error("GET /api/admin/knowledge:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to list knowledge entries",
    });
  }
}

export async function stats(_req, res) {
  try {
    const data = await getKnowledgeStats();
    return res.json({ success: true, ...data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Stats failed",
    });
  }
}

export async function categories(_req, res) {
  try {
    const items = await getKnowledgeCategories();
    return res.json({ success: true, categories: items });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Categories failed",
    });
  }
}

export async function merged(_req, res) {
  try {
    const text = await getMergedKnowledgeText();
    return res.json({
      success: true,
      totalCharacters: text.length,
      text,
      note: "This is the combined learned knowledge used by the FAQ AI.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Merge failed",
    });
  }
}

export async function getEntry(req, res) {
  try {
    const entry = await getKnowledgeEntry(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }
    return res.json({ success: true, entry });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get entry",
    });
  }
}

export async function createEntry(req, res) {
  try {
    if (Array.isArray(req.body?.entries)) {
      const created = await addKnowledgeEntriesBulk(
        req.body.entries,
        req.adminId || "admin"
      );
      return res.status(201).json({
        success: true,
        created: created.length,
        entries: created,
        message: `${created.length} knowledge entries added successfully.`,
      });
    }

    const content = req.body?.content;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Provide "content" (string) or "entries" (array of entries).',
      });
    }

    const entry = await addKnowledgeEntry({
      title: req.body.title,
      content,
      category: req.body.category,
      tags: req.body.tags,
      active: req.body.active,
      addedBy: req.adminId || "admin",
    });

    return res.status(201).json({
      success: true,
      entry,
      message: "Knowledge entry added successfully.",
    });
  } catch (error) {
    console.error("POST /api/admin/knowledge:", error?.message || error);
    return res.status(400).json({
      success: false,
      message: error?.message || "Failed to add knowledge",
    });
  }
}

export async function updateEntry(req, res) {
  try {
    const entry = await updateKnowledgeEntry(req.params.id, {
      title: req.body?.title,
      content: req.body?.content,
      category: req.body?.category,
      tags: req.body?.tags,
      active: req.body?.active,
    });
    if (!entry) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }
    return res.json({ success: true, entry, message: "Knowledge entry updated." });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error?.message || "Failed to update knowledge",
    });
  }
}

export async function deactivateEntry(req, res) {
  try {
    const entry = await deactivateKnowledgeEntry(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }
    return res.json({ success: true, entry, message: "Entry deactivated." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to deactivate",
    });
  }
}

export async function reactivateEntry(req, res) {
  try {
    const entry = await reactivateKnowledgeEntry(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }
    return res.json({ success: true, entry, message: "Entry reactivated." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to reactivate",
    });
  }
}

export async function removeEntry(req, res) {
  try {
    const removed = await deleteKnowledgeEntry(req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }
    return res.json({
      success: true,
      deleted: req.params.id,
      message: "Entry permanently deleted.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete",
    });
  }
}
