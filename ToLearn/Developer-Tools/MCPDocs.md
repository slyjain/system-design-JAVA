# MCP connections in OpenCode

**MCP (Model Context Protocol)** lets an AI client discover and call tools exposed by another service. For example, Render's MCP server exposes deployment and log-reading tools. Connecting the server and authorizing access are separate steps.

## Register an MCP server

```bash
opencode mcp add render --global --url https://mcp.render.com/mcp
opencode mcp list
```

- `add` registers the server; `--global` makes it available across projects. Run it once to configure the server.
- For compatible OAuth servers, **needs authentication** means you should type `/mcps` inside OpenCode, select the server and choose the sign-in option. OAuth grants access through the provider's browser sign-in flow.
- Check `opencode mcp list` again. **Configured** does not mean **connected**; verify the connection before attempting deployment.

## Render: client registration error

`Incompatible auth server: does not support dynamic client registration` means the OAuth server cannot automatically register this AI client. Render supports OAuth for specific clients, but this OpenCode connection could not complete that registration. This is separate from signing in with the correct account.

Render also supports API-key authentication. The global configuration at `~/.config/opencode/opencode.jsonc` now uses `oauth: false` and an `Authorization` header of `Bearer {env:RENDER_API_KEY}`. The secret itself is not in that configuration.

Create an API key in Render's account settings, then enter it in a separate **zsh** terminal:

```zsh
read -rs 'RENDER_API_KEY?Render API key: '
printf '\n'
export RENDER_API_KEY
opencode service restart
opencode mcp list
```

- `read -r` keeps the input literal; `-s` hides it while typing. The `?` prompt syntax here is specific to zsh. Paste the key when prompted, rather than putting it into a command saved in shell history.
- `export` passes the variable to child processes. Restart from this same terminal so the OpenCode background service can load the credential; the session may briefly disconnect. The variable is not permanently saved across new shells.
- Check for **connected** before using tools. An unset variable becomes an empty header credential, so authentication will fail.

For this project's zero-cost constraint, inspect the current MCP tool schema and explicitly pass `plan: free`. Render's connected `create_web_service` tool accepted that value for the counter app, and the returned service confirmed `plan: free`. Tool schemas can differ from older documentation. This tool exposes only a subset of settings; our monorepo build/start commands use `npm --prefix HLD/counter-app` because it does not expose a root-directory field.

MongoDB database credentials let the application access database data. They are separate from Atlas administrative access used to manage projects, clusters and network settings.

References: https://opencode.ai/v2/docs/mcp-servers and https://render.com/docs/mcp-server.
