---
title: "GitHub integration tutorial"
created: 2026-07-20T18:37:04.993170Z
updated: 2026-07-20T19:05:20.793781Z
uuid: b5b52cc8-b484-499c-bfdd-573d1b855b28
source: claude-export
message_count: 10
tags: [claude-history]
---

# GitHub integration tutorial

> For future Claude: this is a verbatim import from a Claude.ai data export. Treat as raw source material, not a note to edit directly.

**Human:**
https://claude.com/resources/tutorials/using-the-github-integration

**Assistant:**
I need to fetch the URL the user provided to see what content I'm working with.
```
This block is not supported on your current device yet.
```

I'm noticing the page only has a Vimeo video embed without any written instructions, so I should search the documentation site for actual textual content about GitHub integration instead.That page is actually just a short video tutorial (about 3 minutes) embedded from Vimeo — there's no written walkthrough on the page itself, so I can't pull text content from it directly.

Since this is a product how-to question, let me check Anthropic's docs for the written version instead.
```
This block is not supported on your current device yet.
```

I've got the official documentation from Claude's site, so I can put together a solid answer based on those resources.Here's what the GitHub integration in Claude.ai does and how to use it, based on Anthropic's docs:

**What it does**
It connects GitHub repositories directly to Claude to give it comprehensive context for software development tasks, so Claude can understand your codebase and help with development questions. It's available on all plans, including the Free plan, and — like all Claude integrations right now — it's in beta.

**How to connect and use it**
- Click the "+" button in the lower-left corner of the chat interface
- Select "Add from GitHub" from the dropdown menu
- Use the file browser to select specific files and folders
- When you send your message, Claude accesses and processes the selected content
- For projects, you can also click the "+" button in your project knowledge section to attach a repo there

**Notes and troubleshooting**
- If you're not authenticated with GitHub, you'll be redirected to authenticate before using the integration
- A warning after entering a valid URL usually means you're trying to connect to a private repository without proper access
- Content doesn't auto-update — it's worth refreshing the GitHub sync periodically, especially before a new analysis or after major repo changes, and you can click "Sync now" to pull the latest changes
- You can add multiple repositories for more context, as long as it all fits within Claude's context window
- If you remove a synced repo, you won't be able to view its contents again in projects where it was added — the preview is removed, but conversation history stays intact

**For organization access issues:** if you're trying to connect an org-owned repo and hit a permissions wall, per the support article: go to github.com/settings/applications, open the Claude entry, and under Organization access click "Grant" for the relevant org. If it says "Request" instead, an org admin needs to approve it from the OAuth application policy settings — disconnecting/reconnecting Claude won't fix this on its own, and SSO-enforcing orgs need the authorization steps redone even after a fresh connection.

One tip from the docs: include the key files and directories central to your current task, and avoid pulling in unnecessary files to stay within token limits and keep Claude focused.

Want me to pull up the actual tutorial video content, or is this written walkthrough enough?

**Human:**
it doesnt show github

**Assistant:**
The user is reporting that the GitHub option isn't appearing in their interface when they try to add something. I should look into the documentation or support resources to find troubleshooting steps for this specific issue.
```
This block is not supported on your current device yet.
```

I found a reference to "Setting Up Claude Integrations" that mentions GitHub integration needs to be enabled first, so it might not be visible if that step hasn't been completed. Let me pull up that help article and check the account settings for integration options.
```
This block is not supported on your current device yet.
```

Ah, that's a common snag — GitHub isn't there by default, it needs to be enabled as a connector first. Here's how to fix it:

**Turn on the GitHub connector**
1. Go to your Claude settings → **Connectors**
2. Find **GitHub** in the list (or browse the [Connectors Directory](https://claude.ai/directory))
3. Connect it — you'll be redirected to GitHub to authenticate if you haven't already
4. Once connected, the "Add from GitHub" option should appear when you click the "+" button in a chat, or in a project's knowledge section

**If it's still not showing up after connecting**, a couple of common causes:
- **Org repos missing:** if your GitHub org requires SSO, you need to separately authorize the Claude app for that org at github.com/settings/applications (under the Claude entry → Organization access → "Grant"). Disconnecting/reconnecting GitHub won't fix this — you have to do this step explicitly.
- **Private repo not appearing:** usually means Claude doesn't have access yet. If you're a GitHub admin, you can grant access yourself; otherwise you'll need to request it from your org's admins.

Want to tell me exactly where you're not seeing it — the "+" button in a regular chat, or the project knowledge section — and whether you've connected GitHub in Settings at all? That'll help me point you to the right fix.

**Human:**
dont find it

**Assistant:**
The user is saying they can't locate the GitHub connector in settings, so I need to clarify what specifically they're having trouble finding—whether it's the settings page itself, the connectors section, or if GitHub just isn't showing up as an available option. Let me ask for more details to narrow down the issue.
```
This block is not supported on your current device yet.
```

**Human:**
F: What exactly can't you find?
A: GitHub isn't in the connectors list

**Assistant:**
I need to figure out why GitHub isn't showing up in the connectors list—it could be restricted by plan, region, or specific app availability, or possibly renamed. Let me check the current documentation to understand what's going on.
```
This block is not supported on your current device yet.
```

I'm noticing there's conflicting information about GitHub integration availability—the documentation says it's available on all plans including Free, but the web connectors through the Connectors Directory are only on paid plans. These might actually be two different features: the classic GitHub integration for adding repos versus the newer MCP-style GitHub connector.

The user saying "GitHub isn't in the connectors list" likely means they checked Settings > Connectors and didn't find it there, which could be because they're on a Free plan (web connectors require paid access) or because GitHub is accessed differently—through the "+" button in chat rather than the Connectors settings page itself.That's actually normal — GitHub isn't always listed as a general connector in the Connectors Directory. It has its own dedicated entry point that works separately from the main connectors list. Try this instead:

**In a regular chat:**
1. Click the **"+"** button in the lower-left of the chat box
2. Look for **"Add from GitHub"** directly in that dropdown (not under a general "connectors" browse list)

**In a Project:**
1. Open the project's knowledge section
2. Click **"+"** and look for **"GitHub"** in that dropdown

This integration is available on all plans, including Free, so a plan restriction shouldn't be the issue — but there are two things worth checking if it's genuinely nowhere to be found:

1. **Platform** — this integration is on Claude.ai web, desktop, and mobile, but the file-browser style GitHub add can behave differently across surfaces. Which app are you using — the web app, desktop app, or mobile?
2. **Account/organization settings** — if you're on a Team or Enterprise plan, an admin may have this integration disabled account-wide.

Can you tell me which platform you're on (web/desktop/mobile) and whether you're on a personal or work/team account? That'll help me narrow down why it's not showing.

**Human:**
desktop

**Assistant:**
I should check if GitHub integration works differently on the Claude Desktop app compared to the web version, or if it needs to be enabled through a separate process on desktop.
```
This block is not supported on your current device yet.
```

I'm noticing there's a key distinction between Anthropic's official Claude Desktop app—which includes chat, collaboration, and code features—versus how third-party MCP servers reference "Claude Desktop" based on older configuration standards, particularly the config file location in the user's library folder.

Since the user just mentioned "desktop" without specifics, it's ambiguous whether they mean the current Claude Desktop app or the legacy MCP-config setup. But given they're likely using the modern Anthropic product, the GitHub integration should work the same way across web and desktop versions. The search results didn't surface any specific known bugs about GitHub integration missing from the desktop app, so I should explore whether this is a configuration issue or a feature limitation.

My best approach is to acknowledge the ambiguity, suggest practical troubleshooting steps like checking for app updates, verifying they're signed into the correct account, and looking for the GitHub option in the connectors menu or the "+" button dropdown. If those don't work, I should recommend checking support.claude.com or filing feedback directly, since I can't inspect their actual app to diagnose the issue.On desktop, GitHub should show up the same way as web — but a few things are worth checking:

1. **Update the app** — an outdated desktop build is the most common reason a feature is simply missing. Check for updates (menu → Check for Updates, or reinstall the latest version).

2. **Look in the right two spots** — it can appear in either place, so check both:
   - Chat: **"+"** button (bottom-left of the message box) → look for **"Add from GitHub"**
   - Settings → **Connectors** → **"Browse connectors"** (this opens the full directory where GitHub may be listed separately from your already-connected list)

3. **Sign-out/sign-in refresh** — sometimes newly available features don't populate until you fully sign out and back in (not just closing the app).

4. **Confirm your account** — if this is a work/Team/Enterprise account, an org admin may have this integration turned off entirely, which would make it invisible rather than just disconnected.

If you've done all that and it's still nowhere to be found, that's likely a bug or account-specific issue rather than something you're missing — in that case, the fastest path is the thumbs-down / feedback option in the app, or support.claude.com directly, since I can't see your account or app state from here.
