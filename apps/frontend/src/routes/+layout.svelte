<script lang="ts">
import "../app.css";

let { children } = $props();
</script>

<nav>
  <a href="/">Home</a>
  <a href="/register">Register</a>
  <a href="/login">Login</a>
</nav>
{@render children()}
