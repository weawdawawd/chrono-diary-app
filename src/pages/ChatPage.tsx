import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, MessageSquarePlus, Search, Send, UserPlus, Users, Check, X, Hash, Loader2, Settings2, Pencil, Trash2, Inbox, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useUnreadChats } from "@/hooks/useUnreadChats";
import SeoHead from "@/components/SeoHead";


type Profile = { user_id: string; username: string | null; display_name: string | null; email: string | null; avatar_url: string | null };
type Friendship = { id: string; requester_id: string; addressee_id: string; status: "pending" | "accepted" | "blocked"; created_at: string };
type Conversation = { id: string; is_group: boolean; name: string | null; created_by: string; last_message_at: string };
type Message = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; edited_at?: string | null };

const PAGE = 30;
const initials = (s?: string | null) => (s || "?").split(/\s+|@/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<Profile | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [friends, setFriends] = useState<{ friendship: Friendship; profile: Profile }[]>([]);
  const [incoming, setIncoming] = useState<{ friendship: Friendship; profile: Profile }[]>([]);
  const [outgoing, setOutgoing] = useState<{ friendship: Friendship; profile: Profile }[]>([]);
  const [conversations, setConversations] = useState<{ conv: Conversation; others: Profile[] }[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [openManage, setOpenManage] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [addMemberIds, setAddMemberIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollBottomRef = useRef(true);
  const { counts: unreadCounts, total: totalUnread, refresh: refreshUnread } = useUnreadChats();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load my profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("user_id,username,display_name,email,avatar_url").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setMe((data as any) ?? { user_id: user.id, username: null, display_name: null, email: user.email ?? null, avatar_url: null });
    });
  }, [user?.id]);

  // Load friendships
  const loadFriendships = useCallback(async () => {
    if (!user) return;
    const { data: fs, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (error) { console.error(error); return; }
    const ids = new Set<string>();
    (fs ?? []).forEach((f: any) => { ids.add(f.requester_id); ids.add(f.addressee_id); });
    ids.delete(user.id);
    const { data: profs } = ids.size
      ? await supabase.rpc("get_profiles_basic_bulk", { _user_ids: Array.from(ids) } as any)
      : { data: [] as any[] };
    const pmap = new Map(((profs as any[]) ?? []).map((p: any) => [p.user_id, p]));
    const accepted: any[] = []; const inc: any[] = []; const out: any[] = [];
    (fs ?? []).forEach((f: any) => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      const profile = pmap.get(otherId) || { user_id: otherId, username: null, display_name: null, email: null, avatar_url: null };
      const entry = { friendship: f, profile };
      if (f.status === "accepted") accepted.push(entry);
      else if (f.status === "pending") {
        if (f.addressee_id === user.id) inc.push(entry);
        else out.push(entry);
      }
    });
    setFriends(accepted); setIncoming(inc); setOutgoing(out);
  }, [user?.id]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data: parts } = await supabase.from("chat_participants").select("conversation_id").eq("user_id", user.id);
    const convIds = (parts ?? []).map((p: any) => p.conversation_id);
    if (convIds.length === 0) { setConversations([]); return; }
    const { data: convs } = await supabase.from("chat_conversations").select("*").in("id", convIds).order("last_message_at", { ascending: false });
    const { data: allParts } = await supabase.from("chat_participants").select("conversation_id,user_id").in("conversation_id", convIds);
    const otherIds = Array.from(new Set((allParts ?? []).map((p: any) => p.user_id).filter((id: string) => id !== user.id)));
    const { data: profs } = otherIds.length
      ? await supabase.rpc("get_profiles_basic_bulk", { _user_ids: otherIds } as any)
      : { data: [] as any[] };
    const pmap = new Map(((profs as any[]) ?? []).map((p: any) => [p.user_id, p]));
    const result = (convs ?? []).map((c: any) => {
      const others = (allParts ?? []).filter((p: any) => p.conversation_id === c.id && p.user_id !== user.id).map((p: any) => pmap.get(p.user_id)).filter(Boolean);
      return { conv: c, others };
    });
    setConversations(result);
  }, [user?.id]);

  useEffect(() => { if (user) { loadFriendships(); loadConversations(); } }, [user?.id, loadFriendships, loadConversations]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("chat-realtime-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as Message;
        if (m.conversation_id === activeConvId) {
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          // mark read immediately if viewing
          markRead(m.conversation_id);
        }
        loadConversations();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as Message;
        if (m.conversation_id === activeConvId) {
          setMessages((prev) => prev.map((x) => x.id === m.id ? m : x));
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.old as Message;
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => loadFriendships())
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_participants" }, () => loadConversations())
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, activeConvId, loadConversations, loadFriendships]);

  const markRead = useCallback(async (convId: string) => {
    if (!user) return;
    await supabase.from("chat_reads").upsert(
      { conversation_id: convId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: "conversation_id,user_id" }
    );
    refreshUnread();
  }, [user?.id, refreshUnread]);

  // Load latest page of messages when opening a conversation
  useEffect(() => {
    if (!activeConvId) { setMessages([]); setHasMore(false); return; }
    shouldScrollBottomRef.current = true;
    supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", activeConvId)
      .order("created_at", { ascending: false })
      .limit(PAGE)
      .then(({ data }) => {
        const arr = ((data as any[]) ?? []).slice().reverse();
        setMessages(arr);
        setHasMore((data?.length ?? 0) >= PAGE);
      });
    markRead(activeConvId);
  }, [activeConvId, markRead]);

  // Scroll to bottom only when new message arrives or conv opens
  useEffect(() => {
    if (!scrollRef.current) return;
    if (shouldScrollBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadOlder = async () => {
    if (!activeConvId || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[0].created_at;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", activeConvId)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE);
    const older = ((data as any[]) ?? []).slice().reverse();
    shouldScrollBottomRef.current = false;
    setMessages((prev) => [...older, ...prev]);
    setHasMore((data?.length ?? 0) >= PAGE);
    setLoadingMore(false);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 40) loadOlder();
  };

  const saveUsername = async () => {
    if (!user) return;
    const u = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (u.length < 3) { toast.error("Username muss mindestens 3 Zeichen haben"); return; }
    const { error } = await supabase.from("profiles").update({ username: u }).eq("user_id", user.id);
    if (error) {
      if (error.code === "23505") toast.error("Username bereits vergeben");
      else toast.error(error.message);
      return;
    }
    setMe((prev) => prev ? { ...prev, username: u } : prev);
    toast.success("Username gespeichert");
  };

  const doSearch = async () => {
    const q = searchUser.trim().toLowerCase().replace(/^@/, "");
    if (!q || q.length < 2) { toast.error("Mind. 2 Zeichen"); return; }
    setSearching(true); setSearchResult(null);
    const { data } = await supabase.rpc("search_profiles", { _q: q });
    setSearching(false);
    const match = (data ?? []).find((p: any) => (p.username || "").toLowerCase() === q) || (data ?? [])[0];
    if (!match) { toast.error("Kein Nutzer gefunden"); return; }
    if ((match as any).user_id === user?.id) { toast.error("Das bist du selbst"); return; }
    setSearchResult(match as any);
  };


  const sendRequest = async (addressee_id: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id, status: "pending" });
    if (error) {
      if (error.code === "23505") toast.error("Bereits angefragt");
      else toast.error(error.message);
      return;
    }
    toast.success("Freundschaftsanfrage gesendet");
    setSearchResult(null); setSearchUser("");
    loadFriendships();
  };

  const respond = async (id: string, accept: boolean) => {
    if (accept) {
      const { error } = await supabase.from("friendships").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Freund hinzugefügt");
    } else {
      const { error } = await supabase.from("friendships").delete().eq("id", id);
      if (error) { toast.error(error.message); return; }
    }
    loadFriendships();
  };

  const openDM = async (otherId: string) => {
    if (!user) return;
    const { data: myParts } = await supabase.from("chat_participants").select("conversation_id").eq("user_id", user.id);
    const myConvIds = (myParts ?? []).map((p: any) => p.conversation_id);
    if (myConvIds.length) {
      const { data: shared } = await supabase
        .from("chat_participants").select("conversation_id").eq("user_id", otherId).in("conversation_id", myConvIds);
      const sharedIds = (shared ?? []).map((p: any) => p.conversation_id);
      if (sharedIds.length) {
        const { data: convs } = await supabase
          .from("chat_conversations").select("*").in("id", sharedIds).eq("is_group", false).limit(1);
        if (convs && convs.length) { setActiveConvId(convs[0].id); return; }
      }
    }
    const { data: conv, error } = await supabase.from("chat_conversations").insert({ is_group: false, created_by: user.id }).select().single();
    if (error || !conv) { toast.error(error?.message || "Fehler"); return; }
    const { error: selfErr } = await supabase.from("chat_participants").insert({ conversation_id: conv.id, user_id: user.id });
    if (selfErr) { toast.error(selfErr.message); return; }
    const { error: pErr } = await supabase.from("chat_participants").insert({ conversation_id: conv.id, user_id: otherId });
    if (pErr) { toast.error(pErr.message); return; }
    setActiveConvId(conv.id);
    loadConversations();
  };

  const createGroup = async () => {
    if (!user) return;
    if (!groupName.trim()) { toast.error("Gruppenname fehlt"); return; }
    if (groupMembers.length === 0) { toast.error("Mindestens 1 Mitglied auswählen"); return; }
    const { data: conv, error } = await supabase.from("chat_conversations").insert({ is_group: true, name: groupName.trim(), created_by: user.id }).select().single();
    if (error || !conv) { toast.error(error?.message || "Fehler"); return; }
    const { error: selfErr } = await supabase.from("chat_participants").insert({ conversation_id: conv.id, user_id: user.id });
    if (selfErr) { toast.error(selfErr.message); return; }
    if (groupMembers.length) {
      const rows = groupMembers.map((uid) => ({ conversation_id: conv.id, user_id: uid }));
      const { error: pErr } = await supabase.from("chat_participants").insert(rows);
      if (pErr) { toast.error(pErr.message); return; }
    }
    toast.success("Gruppe erstellt");
    setOpenGroupDialog(false); setGroupName(""); setGroupMembers([]);
    setActiveConvId(conv.id);
    loadConversations();
  };

  const sendMessage = async () => {
    if (!user || !activeConvId || !draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    shouldScrollBottomRef.current = true;
    const { error } = await supabase.from("chat_messages").insert({ conversation_id: activeConvId, sender_id: user.id, content });
    if (error) { toast.error(error.message); setDraft(content); }
  };

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setEditingDraft(m.content);
  };
  const cancelEdit = () => { setEditingId(null); setEditingDraft(""); };
  const saveEdit = async () => {
    if (!editingId || !editingDraft.trim()) return;
    const newContent = editingDraft.trim();
    const id = editingId;
    setMessages((prev) => prev.map((x) => x.id === id ? { ...x, content: newContent, edited_at: new Date().toISOString() } : x));
    cancelEdit();
    const { error } = await supabase.from("chat_messages").update({ content: newContent, edited_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
  };
  const deleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((x) => x.id !== id));
    setConfirmDeleteId(null);
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) { toast.error(error.message); }
    else toast.success("Nachricht gelöscht");
  };

  const activeConv = useMemo(() => conversations.find((c) => c.conv.id === activeConvId), [conversations, activeConvId]);
  const activeTitle = activeConv ? (activeConv.conv.is_group ? activeConv.conv.name : (activeConv.others[0]?.display_name || activeConv.others[0]?.username || activeConv.others[0]?.email || "Direkt")) : "";

  // Group management actions
  const renameGroup = async () => {
    if (!activeConv || !renameValue.trim()) return;
    const { error } = await supabase.from("chat_conversations").update({ name: renameValue.trim() }).eq("id", activeConv.conv.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Gruppe umbenannt");
    loadConversations();
  };
  const addMembers = async () => {
    if (!activeConv || addMemberIds.length === 0) return;
    const rows = addMemberIds.map((uid) => ({ conversation_id: activeConv.conv.id, user_id: uid }));
    const { error } = await supabase.from("chat_participants").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success("Mitglieder hinzugefügt");
    setAddMemberIds([]);
    loadConversations();
  };
  const removeMember = async (uid: string) => {
    if (!activeConv) return;
    const { error } = await supabase.from("chat_participants").delete().eq("conversation_id", activeConv.conv.id).eq("user_id", uid);
    if (error) { toast.error(error.message); return; }
    toast.success("Mitglied entfernt");
    if (uid === user?.id) { setActiveConvId(null); setOpenManage(false); }
    loadConversations();
  };

  useEffect(() => {
    if (openManage && activeConv) setRenameValue(activeConv.conv.name || "");
  }, [openManage, activeConv?.conv.id]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!user) { navigate("/"); return null; }

  if (me && !me.username) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <SeoHead title="Chat — Username wählen" description="Wähle deinen Username, damit Kollegen dich im Ledion Security Team-Chat finden und als Freund hinzufügen können." path="/chat" noIndex />
        <div className="max-w-md w-full space-y-4 bg-card rounded-2xl p-6 border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8" aria-label="Zurück"><ArrowLeft className="w-4 h-4" /></Button>
            <h1 className="font-display text-lg font-semibold">Username wählen</h1>
          </div>

          <p className="text-sm text-muted-foreground">Mit deinem Username können dich Kollegen finden und als Freund hinzufügen.</p>
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <Input value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="z.B. max.mueller" autoFocus />
          </div>
          <Button onClick={saveUsername} className="w-full">Speichern</Button>
        </div>
      </div>
    );
  }

  const friendsNotInGroup = activeConv?.conv.is_group
    ? friends.filter(({ profile }) => !activeConv.others.some((o) => o.user_id === profile.user_id) && profile.user_id !== user.id)
    : [];

  return (
    <div className="h-screen flex flex-col bg-background">
      <SeoHead title="Team-Chat — Ledion Security" description="Schreibe direkt mit Kollegen, beantworte Freundschaftsanfragen und koordiniere Schichten in Echtzeit über den internen Ledion Security Team-Chat." path="/chat" noIndex />
      <header className="h-14 border-b flex items-center px-3 gap-2 bg-card/90 backdrop-blur-xl">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8" aria-label="Zurück zur Startseite"><ArrowLeft className="w-4 h-4" /></Button>

        <h1 className="font-display font-semibold flex-1 truncate flex items-center gap-2">
          Chat
          {totalUnread > 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{totalUnread}</Badge>}
        </h1>
        {me?.username && <Badge variant="secondary" className="font-mono text-[10px]">@{me.username}</Badge>}
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className={`w-full md:w-80 border-r flex flex-col ${activeConvId ? "hidden md:flex" : "flex"}`}>
          <Tabs defaultValue="chats" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 mx-3 mt-3">
              <TabsTrigger value="chats" className="relative">
                <MessageSquarePlus className="w-3.5 h-3.5 mr-1" /> Chats
                {totalUnread > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{totalUnread}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="requests" className="relative">
                <Inbox className="w-3.5 h-3.5 mr-1" /> Anfragen
                {incoming.length > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{incoming.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="friends"><UserPlus className="w-3.5 h-3.5 mr-1" /> Freunde</TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="flex-1 m-0 flex flex-col min-h-0">
              <div className="p-3 border-b">
                <Dialog open={openGroupDialog} onOpenChange={setOpenGroupDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full"><Users className="w-3.5 h-3.5 mr-1.5" /> Neue Gruppe</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Gruppen-Chat erstellen</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Input placeholder="Gruppenname" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                      <div className="text-xs text-muted-foreground">Mitglieder auswählen (aus deinen Freunden):</div>
                      <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-2">
                        {friends.length === 0 && <div className="text-xs text-muted-foreground py-4 text-center">Du hast noch keine Freunde.</div>}
                        {friends.map(({ profile }) => {
                          const checked = groupMembers.includes(profile.user_id);
                          return (
                            <label key={profile.user_id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                              <input type="checkbox" checked={checked} onChange={(e) => {
                                setGroupMembers((prev) => e.target.checked ? [...prev, profile.user_id] : prev.filter((id) => id !== profile.user_id));
                              }} />
                              <Avatar className="w-6 h-6"><AvatarImage src={profile.avatar_url ?? undefined} /><AvatarFallback className="text-[10px]">{initials(profile.display_name || profile.username || profile.email)}</AvatarFallback></Avatar>
                              <span className="text-sm">{profile.display_name || profile.username || profile.email}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={createGroup}>Erstellen</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {conversations.length === 0 && (
                    <div className="text-xs text-muted-foreground p-6 text-center">Noch keine Konversationen.</div>
                  )}
                  {conversations.map(({ conv, others }) => {
                    const title = conv.is_group ? conv.name : (others[0]?.display_name || others[0]?.username || others[0]?.email || "Direkt");
                    const unread = unreadCounts[conv.id] || 0;
                    return (
                      <button key={conv.id} onClick={() => setActiveConvId(conv.id)} className={`w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-muted ${activeConvId === conv.id ? "bg-muted" : ""}`}>
                        {conv.is_group ? (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
                        ) : (
                          <Avatar className="w-9 h-9"><AvatarImage src={others[0]?.avatar_url ?? undefined} /><AvatarFallback>{initials(title)}</AvatarFallback></Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm truncate ${unread > 0 ? "font-semibold" : "font-medium"}`}>{title}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: de })}</div>
                        </div>
                        {unread > 0 && <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px]">{unread}</Badge>}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="requests" className="flex-1 m-0 flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Eingehend ({incoming.length})</div>
                    {incoming.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-4 text-center border rounded-md">Keine offenen Anfragen.</div>
                    ) : (
                      <div className="space-y-1">
                        {incoming.map(({ friendship, profile }) => (
                          <div key={friendship.id} className="flex items-center gap-2 p-2 rounded-md border bg-card">
                            <Avatar className="w-9 h-9"><AvatarImage src={profile.avatar_url ?? undefined} /><AvatarFallback>{initials(profile.display_name || profile.username || profile.email)}</AvatarFallback></Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{profile.display_name || profile.username || profile.email}</div>
                              {profile.username && <div className="text-[11px] text-muted-foreground truncate">@{profile.username}</div>}
                            </div>
                            <Button size="sm" variant="default" className="h-7 gap-1" onClick={() => respond(friendship.id, true)}><Check className="w-3.5 h-3.5" /> Annehmen</Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => respond(friendship.id, false)}><X className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Gesendet ({outgoing.length})</div>
                    {outgoing.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-4 text-center border rounded-md">Keine ausstehenden Anfragen.</div>
                    ) : (
                      <div className="space-y-1">
                        {outgoing.map(({ friendship, profile }) => (
                          <div key={friendship.id} className="flex items-center gap-2 p-2 rounded-md border opacity-80">
                            <Avatar className="w-8 h-8"><AvatarImage src={profile.avatar_url ?? undefined} /><AvatarFallback>{initials(profile.display_name || profile.username || profile.email)}</AvatarFallback></Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{profile.display_name || profile.username || profile.email}</div>
                              <div className="text-[11px] text-muted-foreground">wartet auf Antwort</div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => respond(friendship.id, false)}><X className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="friends" className="flex-1 m-0 flex flex-col min-h-0">
              <div className="p-3 border-b space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input value={searchUser} onChange={(e) => setSearchUser(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder="@username suchen" className="pl-8 h-9" />
                  </div>
                  <Button size="sm" onClick={doSearch} disabled={searching}>{searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Suchen"}</Button>
                </div>
                {searchResult && (
                  <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/40">
                    <Avatar className="w-8 h-8"><AvatarImage src={searchResult.avatar_url ?? undefined} /><AvatarFallback>{initials(searchResult.display_name || searchResult.username)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{searchResult.display_name || searchResult.username}</div>
                      <div className="text-[11px] text-muted-foreground truncate">@{searchResult.username}</div>
                    </div>
                    <Button size="sm" onClick={() => sendRequest(searchResult.user_id)}><UserPlus className="w-3.5 h-3.5" /></Button>
                  </div>
                )}
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Freunde ({friends.length})</div>
                  {friends.length === 0 && <div className="text-xs text-muted-foreground py-2">Noch keine Freunde. Suche oben nach @username.</div>}
                  {friends.map(({ profile }) => (
                    <button key={profile.user_id} onClick={() => openDM(profile.user_id)} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left">
                      <Avatar className="w-8 h-8"><AvatarImage src={profile.avatar_url ?? undefined} /><AvatarFallback>{initials(profile.display_name || profile.username || profile.email)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{profile.display_name || profile.username || profile.email}</div>
                        {profile.username && <div className="text-[11px] text-muted-foreground truncate">@{profile.username}</div>}
                      </div>
                      <MessageSquarePlus className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        <section className={`flex-1 flex flex-col min-h-0 ${activeConvId ? "flex" : "hidden md:flex"}`}>
          {!activeConvId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Wähle eine Konversation oder starte mit einem Freund.
            </div>
          ) : (
            <>
              <div className="h-12 border-b flex items-center gap-2 px-3">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setActiveConvId(null)} aria-label="Zurück zur Chat-Liste"><ArrowLeft className="w-4 h-4" /></Button>
                {activeConv?.conv.is_group ? <Users className="w-4 h-4 text-primary" /> : null}
                <div className="font-medium text-sm truncate flex-1">{activeTitle}</div>
                {activeConv?.conv.is_group && (
                  <>
                    <Badge variant="secondary" className="text-[10px]">{activeConv.others.length + 1} Mitglieder</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpenManage(true)} aria-label="Gruppe verwalten">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingMore && <div className="text-center text-xs text-muted-foreground py-2"><Loader2 className="w-3 h-3 inline animate-spin mr-1" /> Lädt…</div>}
                {!hasMore && messages.length > 0 && <div className="text-center text-[10px] text-muted-foreground/60 py-2">Anfang der Konversation</div>}
                {messages.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">Noch keine Nachrichten.</div>}
                {messages.map((m, idx) => {
                  const mine = m.sender_id === user.id;
                  const prev = messages[idx - 1];
                  const showSender = activeConv?.conv.is_group && !mine && prev?.sender_id !== m.sender_id;
                  const sender = activeConv?.others.find((o) => o.user_id === m.sender_id);
                  const isEditing = editingId === m.id;
                  return (
                    <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                        {showSender && <div className="text-[10px] text-muted-foreground mb-0.5 px-1">{sender?.display_name || sender?.username || "?"}</div>}
                        <div className={`flex items-start gap-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                          <div className={`rounded-2xl px-3 py-1.5 text-sm whitespace-pre-wrap break-words ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            {isEditing ? (
                              <div className="flex flex-col gap-1 min-w-[180px]">
                                <Input
                                  value={editingDraft}
                                  onChange={(e) => setEditingDraft(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); } if (e.key === "Escape") cancelEdit(); }}
                                  autoFocus
                                  className="h-8 bg-background text-foreground"
                                />
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={cancelEdit}>Abbr.</Button>
                                  <Button size="sm" className="h-6 px-2 text-xs" onClick={saveEdit} disabled={!editingDraft.trim()}>Speichern</Button>
                                </div>
                              </div>
                            ) : (
                              m.content
                            )}
                          </div>
                          {mine && !isEditing && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 text-muted-foreground" aria-label="Nachricht bearbeiten oder löschen">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onClick={() => startEdit(m)}>
                                  <Pencil className="w-3.5 h-3.5 mr-2" /> Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDeleteId(m.id)}>
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 px-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {m.edited_at && <span className="ml-1 italic">(bearbeitet)</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="border-t p-2 flex items-end gap-2">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nachricht schreiben…" autoFocus className="flex-1" />
                <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Nachricht senden"><Send className="w-4 h-4" /></Button>
              </form>
            </>
          )}
        </section>
      </div>

      {/* Group management dialog */}
      <Dialog open={openManage} onOpenChange={setOpenManage}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Gruppe verwalten</DialogTitle></DialogHeader>
          {activeConv?.conv.is_group && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Pencil className="w-3 h-3" /> Name</div>
                <div className="flex gap-2">
                  <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                  <Button onClick={renameGroup} disabled={!renameValue.trim() || renameValue.trim() === activeConv.conv.name}>Speichern</Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Mitglieder ({activeConv.others.length + 1})</div>
                <div className="space-y-1 border rounded-md p-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 p-1.5">
                    <Avatar className="w-7 h-7"><AvatarImage src={me?.avatar_url ?? undefined} /><AvatarFallback className="text-[10px]">{initials(me?.display_name || me?.username || me?.email)}</AvatarFallback></Avatar>
                    <span className="text-sm flex-1">{me?.display_name || me?.username || me?.email} <span className="text-[10px] text-muted-foreground">(du)</span></span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeMember(user.id)}>Verlassen</Button>
                  </div>
                  {activeConv.others.map((p) => (
                    <div key={p.user_id} className="flex items-center gap-2 p-1.5">
                      <Avatar className="w-7 h-7"><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback className="text-[10px]">{initials(p.display_name || p.username || p.email)}</AvatarFallback></Avatar>
                      <span className="text-sm flex-1 truncate">{p.display_name || p.username || p.email}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeMember(p.user_id)} aria-label="Entfernen"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Freunde hinzufügen</div>
                {friendsNotInGroup.length === 0 ? (
                  <div className="text-xs text-muted-foreground border rounded-md p-3 text-center">Alle Freunde sind bereits Mitglied.</div>
                ) : (
                  <>
                    <div className="space-y-1 border rounded-md p-2 max-h-40 overflow-y-auto">
                      {friendsNotInGroup.map(({ profile }) => {
                        const checked = addMemberIds.includes(profile.user_id);
                        return (
                          <label key={profile.user_id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                            <input type="checkbox" checked={checked} onChange={(e) => {
                              setAddMemberIds((prev) => e.target.checked ? [...prev, profile.user_id] : prev.filter((id) => id !== profile.user_id));
                            }} />
                            <Avatar className="w-6 h-6"><AvatarImage src={profile.avatar_url ?? undefined} /><AvatarFallback className="text-[10px]">{initials(profile.display_name || profile.username || profile.email)}</AvatarFallback></Avatar>
                            <span className="text-sm">{profile.display_name || profile.username || profile.email}</span>
                          </label>
                        );
                      })}
                    </div>
                    <Button size="sm" onClick={addMembers} disabled={addMemberIds.length === 0} className="w-full">Hinzufügen ({addMemberIds.length})</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nachricht löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => confirmDeleteId && deleteMessage(confirmDeleteId)}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
