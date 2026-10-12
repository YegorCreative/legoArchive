import { authErrorMessage, creatorShareQuery, normalizeBiography, normalizeDisplayName, normalizeUsername } from "../lib/community";
import { createCommunityClient } from "../lib/supabase-browser";

function show(panels: HTMLElement[], active: HTMLElement): void {
  for (const panel of panels) panel.hidden = panel !== active;
}

export function mountAccount(root: HTMLElement): void {
  const offline = root.querySelector("#account-offline");
  const signedOut = root.querySelector("#account-signed-out");
  const recovery = root.querySelector("#account-recovery");
  const claim = root.querySelector("#account-claim");
  const ready = root.querySelector("#account-ready");
  const status = root.querySelector("#account-status");
  if (!(offline instanceof HTMLElement) || !(signedOut instanceof HTMLElement) || !(recovery instanceof HTMLElement) || !(claim instanceof HTMLElement) || !(ready instanceof HTMLElement) || !(status instanceof HTMLElement)) return;
  const panels = [offline, signedOut, recovery, claim, ready];
  const say = (text: string) => { status.textContent = text; };
  const client = createCommunityClient();
  if (!client) {
    show(panels, offline);
    say("Accounts are not connected.");
    return;
  }

  const accountUrl = new URL(root.dataset.accountUrl || "/", window.location.origin).href;
  const baseUrl = new URL(root.dataset.base || "/", window.location.origin);

  const paintReady = (profile: { username: string; display_name: string; biography: string; created_at: string }) => {
    show(panels, ready);
    const name = ready.querySelector<HTMLInputElement>("[name=display_name]");
    const bio = ready.querySelector<HTMLTextAreaElement>("[name=biography]");
    if (name) name.value = profile.display_name;
    if (bio) bio.value = profile.biography;
    const share = ready.querySelector("#share-url");
    if (share) share.textContent = new URL(creatorShareQuery(profile.username), baseUrl).href;
    const joined = ready.querySelector("#joined");
    if (joined) joined.textContent = new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const username = ready.querySelector("#username-readout");
    if (username) username.textContent = profile.username;
    say("Signed in. Your email stays in the account service and is not shown on your public profile.");
  };

  const route = async () => {
    const { data } = await client.auth.getSession();
    const session = data.session;
    if (!session) {
      show(panels, signedOut);
      say("Sign in with email. Google and Apple appear below and work only after those providers are enabled.");
      return;
    }
    const { data: profile, error } = await client.from("profiles").select("username, display_name, biography, created_at").eq("user_id", session.user.id).maybeSingle();
    if (error) {
      say(authErrorMessage(error.message));
      return;
    }
    if (!profile) {
      show(panels, claim);
      say("Choose a public username. This does not publish a character.");
      return;
    }
    paintReady(profile);
  };

  client.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      show(panels, recovery);
      say("Choose a new password for this account.");
      return;
    }
    void route();
  });

  signedOut.querySelector("#signup-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    if (data.get("age") !== "yes") {
      say("Confirm that you are 13 or older before creating an account.");
      return;
    }
    const password = String(data.get("password") || "");
    if (password.length < 8) {
      say("Use a password of at least 8 characters.");
      return;
    }
    say("Creating the account…");
    const { data: created, error } = await client.auth.signUp({
      email: String(data.get("email") || "").trim(),
      password,
      options: { emailRedirectTo: accountUrl },
    });
    if (error) {
      say(authErrorMessage(error.message));
      return;
    }
    if (!created.session) {
      show(panels, signedOut);
      say("Check your email and confirm the address before signing in. Nothing is published by registering.");
      return;
    }
    await route();
  });

  signedOut.querySelector("#signin-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    say("Signing in…");
    const { error } = await client.auth.signInWithPassword({
      email: String(data.get("email") || "").trim(),
      password: String(data.get("password") || ""),
    });
    say(error ? authErrorMessage(error.message) : "Signed in.");
    if (!error) await route();
  });

  signedOut.querySelector("#reset-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const email = String(new FormData(form).get("email") || "").trim();
    say("Sending the reset message…");
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: accountUrl });
    say(error ? authErrorMessage(error.message) : "If that email is registered, a reset message is on its way.");
  });

  const startProvider = async (provider: "google" | "apple") => {
    say(`Opening ${provider} sign-in. It works only after that provider is enabled in Supabase.`);
    const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo: accountUrl } });
    if (error) say(authErrorMessage(error.message));
  };
  signedOut.querySelector("#google-sign-in")?.addEventListener("click", () => { void startProvider("google"); });
  signedOut.querySelector("#apple-sign-in")?.addEventListener("click", () => { void startProvider("apple"); });

  recovery.querySelector("#new-password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const password = String(new FormData(form).get("password") || "");
    if (password.length < 8) {
      say("Use a password of at least 8 characters.");
      return;
    }
    const { error } = await client.auth.updateUser({ password });
    say(error ? authErrorMessage(error.message) : "Password updated.");
    if (!error) await route();
  });

  claim.querySelector("#claim-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    const username = normalizeUsername(String(data.get("username") || ""));
    const displayName = normalizeDisplayName(String(data.get("display_name") || ""));
    const biography = normalizeBiography(String(data.get("biography") || ""));
    if (!username || !displayName || biography == null || data.get("age") !== "yes") {
      say("Use 3 to 32 letters, numbers, or single hyphens, a display name, and confirm you are 13 or older.");
      return;
    }
    const { data: userData } = await client.auth.getUser();
    if (!userData.user) {
      say("Sign in again before claiming a username.");
      return;
    }
    say("Saving the profile…");
    const { error } = await client.from("profiles").insert({
      user_id: userData.user.id,
      username,
      display_name: displayName,
      biography,
      minimum_age_confirmed: true,
    });
    if (error) {
      say(/duplicate|unique/i.test(error.message) ? "That username is already taken." : authErrorMessage(error.message));
      return;
    }
    await route();
  });

  ready.querySelector("#profile-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    const displayName = normalizeDisplayName(String(data.get("display_name") || ""));
    const biography = normalizeBiography(String(data.get("biography") || ""));
    if (!displayName || biography == null) {
      say("Check the display name and biography lengths.");
      return;
    }
    const { data: userData } = await client.auth.getUser();
    if (!userData.user) return;
    const { error } = await client.from("profiles").update({ display_name: displayName, biography }).eq("user_id", userData.user.id);
    say(error ? authErrorMessage(error.message) : "Profile saved.");
  });

  ready.querySelector("#sign-out")?.addEventListener("click", async () => {
    await client.auth.signOut();
    say("Signed out on this browser.");
    await route();
  });

  ready.querySelector("#delete-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    if (String(new FormData(form).get("confirm") || "") !== "DELETE") {
      say("Type DELETE to remove the profile and its characters.");
      return;
    }
    const { error } = await client.rpc("delete_my_creator_data");
    if (error) {
      say(authErrorMessage(error.message));
      return;
    }
    await client.auth.signOut();
    say("Profile and characters were deleted. The login email remains in Supabase until the project owner removes that auth user. Local drafts on this browser were not deleted.");
    await route();
  });
}
