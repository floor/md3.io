<!-- Svelte: material/svelte wraps the same elements; bind: keeps their live state. -->
<script lang="ts">
  import { Button, Card, Switch } from "material/svelte";
  import { DEFAULTS, summary } from "./shared";

  let s = $state({ ...DEFAULTS });
  let status = $state("");
</script>

<section class="notify">
  <Card headline="Notifications">
    <p>Get a message when a save finishes.</p>
    <Switch class="notify__switch" bind:checked={s.notify}>Notify me</Switch>
    {#snippet actions()}
      <Button onclick={() => (status = summary(s))}>Save</Button>
    {/snippet}
  </Card>
  <output class="notify__status" role="status">{status}</output>
</section>
