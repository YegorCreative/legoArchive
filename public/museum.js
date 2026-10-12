(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("error", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement) || !target.classList.contains("set-img")) return;
    target.closest(".shot")?.classList.add("is-missing");
  }, true);

  let dialog = null;
  document.addEventListener("click", (event) => {
    const loose = event.target instanceof Element ? event.target.closest("[data-loose]") : null;
    if (loose instanceof HTMLButtonElement) {
      const fact = document.getElementById(loose.getAttribute("aria-controls") || "");
      const open = loose.getAttribute("aria-expanded") === "true";
      loose.setAttribute("aria-expanded", open ? "false" : "true");
      if (fact) fact.hidden = open;
      return;
    }
    const rebuild = event.target instanceof Element ? event.target.closest("[data-rebuild]") : null;
    if (rebuild instanceof HTMLElement) {
      const scene = document.getElementById(rebuild.dataset.rebuild || "");
      scene?.querySelectorAll(".iso-brick").forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.style.animation = "none";
        void node.offsetWidth;
        node.style.animation = "";
      });
    }
    const opener = event.target instanceof Element ? event.target.closest("[data-zoom]") : null;
    if (!(opener instanceof HTMLElement)) return;
    const src = opener.dataset.zoom;
    if (!src) return;
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "lightbox";
      dialog.innerHTML = '<button type="button" class="lightbox-close">Close</button><img alt=""><p class="quiet">This is the single catalog photograph. It is not a 3D model or another camera angle.</p>';
      dialog.addEventListener("click", (click) => {
        if (click.target === dialog) dialog.close();
      });
      dialog.querySelector(".lightbox-close")?.addEventListener("click", () => dialog.close());
      document.body.append(dialog);
    }
    const image = dialog.querySelector("img");
    if (image) {
      image.src = src;
      image.alt = opener.dataset.zoomAlt || "";
    }
    dialog.showModal();
  });

  const scenes = [...document.querySelectorAll("[data-scene], [data-parallax]")];
  if (!reduce && scenes.length > 0) {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const onScroll = () => {
      for (const scene of scenes) {
        if (!(scene instanceof HTMLElement)) continue;
        const box = scene.getBoundingClientRect();
        const through = Math.max(0, Math.min(1, -box.top / Math.max(scene.offsetHeight * 0.85, 1)));
        const seen = Math.max(0, Math.min(1, (window.innerHeight * 0.9 - box.top) / (window.innerHeight * 0.55 + scene.offsetHeight * 0.25)));
        scene.style.setProperty("--scroll", through.toFixed(3));
        scene.style.setProperty("--p", seen.toFixed(3));
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (fine) {
      for (const scene of scenes) {
        if (!(scene instanceof HTMLElement) || !scene.hasAttribute("data-parallax")) continue;
        scene.addEventListener("pointermove", (event) => {
          const box = scene.getBoundingClientRect();
          scene.style.setProperty("--px", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
          scene.style.setProperty("--py", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
        });
      }
    }
  }

  document.querySelectorAll("[data-timeline]").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      node.scrollBy({ left: event.key === "ArrowRight" ? 320 : -320, behavior: reduce ? "auto" : "smooth" });
      event.preventDefault();
    });
  });

  const map = document.querySelector("[data-universe]");
  if (!(map instanceof HTMLElement)) return;
  const stage = map.querySelector("[data-universe-stage]");
  const canvas = map.querySelector("[data-universe-canvas]");
  if (!(stage instanceof HTMLElement) || !(canvas instanceof HTMLElement)) return;
  let x = 0;
  let y = 0;
  let scale = 1;
  let drag = null;
  const apply = () => {
    canvas.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };
  const zoomBy = (factor) => {
    scale = Math.min(2.6, Math.max(0.65, scale * factor));
    apply();
  };
  map.querySelector("[data-zoom-in]")?.addEventListener("click", () => zoomBy(1.2));
  map.querySelector("[data-zoom-out]")?.addEventListener("click", () => zoomBy(1 / 1.2));
  const reset = () => {
    x = 0;
    y = 0;
    scale = 1;
    apply();
  };
  map.querySelector("[data-reset]")?.addEventListener("click", reset);
  stage.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 80 : 40;
    if (event.key === "ArrowLeft") x += step;
    else if (event.key === "ArrowRight") x -= step;
    else if (event.key === "ArrowUp") y += step;
    else if (event.key === "ArrowDown") y -= step;
    else if (event.key === "+" || event.key === "=") zoomBy(1.2);
    else if (event.key === "-" || event.key === "_") zoomBy(1 / 1.2);
    else if (event.key === "Home") reset();
    else return;
    event.preventDefault();
    apply();
  });
  stage.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) return;
    drag = { id: event.pointerId, x: event.clientX - x, y: event.clientY - y };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    x = event.clientX - drag.x;
    y = event.clientY - drag.y;
    apply();
  });
  const endDrag = (event) => {
    if (drag && drag.id === event.pointerId) drag = null;
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  const search = map.querySelector("[data-universe-search]");
  if (search instanceof HTMLInputElement) {
    const nodes = [...map.querySelectorAll("[data-node]")];
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      for (const node of nodes) {
        if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) continue;
        const name = (node.dataset.node || "").toLowerCase();
        const hide = query.length > 0 && !name.includes(query);
        node.classList.toggle("is-dim", hide);
      }
    });
  }
})();
