import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  async function handleAuth() {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        setError("Email and password required");
        return;
      }

      // ---------------- SIGN UP ----------------
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          return;
        }

        // IMPORTANT: Supabase may NOT auto-create session
        const session = data.session;

        if (session) {
          router.replace("/onboarding");
          return;
        }

        // fallback: force login flow
        setMode("login");
        setError("Account created. Please log in.");
        return;
      }

      // ---------------- LOGIN ----------------
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        router.replace("/");
      } else {
        setError("Login failed. No session returned.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0b0b0b",
        padding: 24,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 34,
          fontWeight: "800",
          marginBottom: 10,
        }}
      >
        Fit AI Coach
      </Text>

      <Text style={{ color: "#9ca3af", marginBottom: 30 }}>
        {mode === "login" ? "Login to continue" : "Create your account"}
      </Text>

      {/* ERROR DISPLAY (IMPORTANT DEBUG FIX) */}
      {error && (
        <Text style={{ color: "#ff4d4d", marginBottom: 12 }}>
          {error}
        </Text>
      )}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{
          backgroundColor: "#1a1a1a",
          padding: 14,
          borderRadius: 12,
          color: "white",
          marginBottom: 12,
        }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: "#1a1a1a",
          padding: 14,
          borderRadius: 12,
          color: "white",
          marginBottom: 20,
        }}
      />

      {/* MAIN BUTTON */}
      <TouchableOpacity
        onPress={handleAuth}
        disabled={loading}
        style={{
          backgroundColor: "white",
          padding: 16,
          borderRadius: 14,
          alignItems: "center",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ fontWeight: "800" }}>
          {loading
            ? "Loading..."
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </Text>
      </TouchableOpacity>

      {/* TOGGLE */}
      <TouchableOpacity
        onPress={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError(null);
        }}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: "#9ca3af", textAlign: "center" }}>
          {mode === "login"
            ? "Don't have an account? Sign up"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}