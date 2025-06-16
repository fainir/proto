# Computer-Use Demo – Quick Start

This repository lets you spin up a full Linux desktop (XFCE, Chrome, Streamlit chat) inside a Docker container.

---
## 1 - Build & launch

Choose one of the Makefile targets:

```bash
# hot-reload: code changes in computer_use_demo/ reflect instantly
make dev

# normal run (no live mount)
make vm
```

Both targets:
* Build the image for `linux/amd64`.
* Create/start a container.
* Forward ports 8080 (Streamlit wrapper page), 8501 (Streamlit backend) and 6080 (noVNC).
* Mount a named Docker volume `computer-use-demo-home` to persist the VM's home directory.

As soon as you see
```
✨ Computer Use Demo is ready!
➡️  Open http://localhost:8080 in your browser to begin
```
open that URL to access the VM.

---
## 2 - Shut down (but keep state)

Stop the running container:

```bash
# if you used make dev
docker stop computer-use-demo-dev

# if you used make vm
docker stop computer-use-demo
```

The container halts but is **not** removed, and the `computer-use-demo-home` volume keeps all files, Chrome profile, etc.

---
## 3 - Resume exactly where you left off

```bash
make dev   # for the dev container (or: docker start computer-use-demo-dev)

make vm    # for the normal container (or: docker start computer-use-demo)
```

The Makefile detects an existing container and starts it, so your session picks up right away.

---
## 4 - Reset to a clean slate (optional)

If you want to discard all saved data:

```bash
# remove any stopped/running containers
docker rm -f computer-use-demo-dev computer-use-demo 2>/dev/null || true

# delete the persistent volume
docker volume rm computer-use-demo-home
```

The next `make dev` / `make vm` will create a brand-new VM. 