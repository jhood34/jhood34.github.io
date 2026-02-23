// ============================================================
// 1. HAMBURGER MENU (mobile navigation)
// ============================================================
const menu_button = document.querySelector(".navbar_toggleBtn");
const menu_items = document.querySelector(".navbar_menu");

menu_button.addEventListener("click", () => {
  menu_button.classList.toggle("active");

  // No animation for most browsers :
  if (!document.startViewTransition) {
    menu_items.classList.toggle("active");
    return;
  }

  // Animation for future browsers :
  document.startViewTransition(() => menu_items.classList.toggle("active"));
});

// ============================================================
// 2. VANILLA TILT (landing page parallax images)
// ============================================================
if (document.body.classList.contains("landing-page")) {
  const normal_image = document.querySelector("welcome-image_front");
  const shifted_images = document.querySelectorAll("welcome-image_behind");

  VanillaTilt.init(document.querySelector(normal_image), {
    max: 25,
    speed: 400,
  });

  VanillaTilt.init(document.querySelector("welcome-image_behind"));
}

// ============================================================
// 3. REMOVE HOVER EFFECTS ON MOBILE
// ============================================================
function hasTouch() {
  return 'ontouchstart' in document.documentElement
    || navigator.maxTouchPoints > 0
    || navigator.msMaxTouchPoints > 0;
}

if (hasTouch()) {
  try {
    for (var si in document.styleSheets) {
      var styleSheet = document.styleSheets[si];
      if (!styleSheet.rules) continue;

      for (var ri = styleSheet.rules.length - 1; ri >= 0; ri--) {
        if (!styleSheet.rules[ri].selectorText) continue;

        if (styleSheet.rules[ri].selectorText.match(':hover')) {
          styleSheet.deleteRule(ri);
        }
      }
    }
  } catch (ex) { }
}

// ============================================================
// 4. LIVE CLOCK
// ============================================================
var live_time = document.getElementById("live-clock");

function time() {
  var date = new Date();
  var s = date.getSeconds();
  var m = date.getMinutes();
  var h = date.getHours();

  live_time.textContent =
    ("0" + h).substr(-2) +
    ":" +
    ("0" + m).substr(-2) +
    ":" +
    ("0" + s).substr(-2);
}

setInterval(time, 1000);

// ============================================================
// 5. GALLERY POPUP (lightbox)
// ============================================================
function setupGalleryPopup() {
  const gallery = document.querySelector(".gallery");
  const popup = document.querySelector(".popup");
  if (!gallery || !popup) return;

  const images = gallery.querySelectorAll("img");

  images.forEach(function (image) {
    image.addEventListener("click", function () {
      popup.innerHTML = "<img src='" + this.src + "' />";
      popup.style.display = "flex";
      gallery.classList.add("active");
    });
  });

  ["click", "onkeydown"].forEach((evt) =>
    popup.addEventListener(
      evt,
      function () {
        this.style.display = "none";
        this.innerHTML = "";
        gallery.classList.remove("active");
      },
      false
    )
  );
}

// Set up popup for statically-loaded galleries (if any images already exist)
setupGalleryPopup();

// ============================================================
// 6. DYNAMIC GALLERY LOADING (gallery.html)
// ============================================================
async function loadGallery() {
  const container = document.getElementById("gallery-container");
  if (!container) return;

  // Read country from URL: gallery.html?country=japan
  const params = new URLSearchParams(window.location.search);
  const country = params.get("country");

  if (!country) {
    container.innerHTML = "<p>No country specified.</p>";
    return;
  }

  try {
    // Fetch gallery metadata from master list
    const galleriesRes = await fetch("galleries.json");
    const galleries = await galleriesRes.json();
    const meta = galleries.find((g) => g.id === country);

    if (!meta) {
      container.innerHTML = "<p>Country not found.</p>";
      return;
    }

    // Set page metadata
    document.getElementById("gallery-title").textContent = meta.title;
    document.getElementById("gallery-year").textContent = meta.year;
    document.title = meta.title + " — Light Leaks Photography";

    // Fetch the country's image list
    const imagesRes = await fetch(
      "images/Journey_Images/" + country + "/gallery.json"
    );
    const images = await imagesRes.json();

    // Build gallery images
    const basePath = "images/Journey_Images/" + country + "/";
    images.forEach(function (img) {
      const el = document.createElement("img");
      el.src = basePath + img.file;
      el.alt = img.alt;
      el.loading = "lazy";
      container.appendChild(el);
    });

    // Wire up popup handlers for the new images
    setupGalleryPopup();
  } catch (err) {
    console.error("Error loading gallery:", err);
    container.innerHTML = "<p>Error loading gallery.</p>";
  }
}

// ============================================================
// 7. DYNAMIC JOURNEY THUMBNAILS (journeys.html)
// ============================================================
async function loadJourneyThumbnails() {
  const container = document.getElementById("journey-thumbnails");
  if (!container) return;

  try {
    const res = await fetch("galleries.json");
    const galleries = await res.json();

    galleries.forEach(function (gallery) {
      const li = document.createElement("li");
      li.className = "journey-item";
      li.setAttribute("data-tilt", "");

      const a = document.createElement("a");
      a.href = "gallery.html?country=" + gallery.id;

      const box = document.createElement("div");
      box.className = "journey-item-box";

      const img = document.createElement("img");
      img.src = "images/journey_thumbnail_images/" + gallery.thumbnail;
      img.loading = "lazy";

      const span = document.createElement("span");
      span.className = "journey-box-text";
      span.textContent = gallery.title;

      box.appendChild(img);
      box.appendChild(span);
      a.appendChild(box);
      li.appendChild(a);
      container.appendChild(li);
    });

    // Initialise vanilla-tilt on the new elements
    if (typeof VanillaTilt !== "undefined") {
      VanillaTilt.init(document.querySelectorAll(".journey-item[data-tilt]"), {
        max: 15,
        speed: 400,
      });
    }
  } catch (err) {
    console.error("Error loading journey thumbnails:", err);
  }
}

// ============================================================
// 8. PAGE INITIALISATION
// ============================================================
// Run the appropriate loader based on which page we're on
if (document.getElementById("gallery-container")) {
  loadGallery();
}
if (document.getElementById("journey-thumbnails")) {
  loadJourneyThumbnails();
}

// ============================================================
// 9. FORM VALIDATION (contact.html)
// ============================================================
function form_validator() {
  var name_checker = document.forms["contact_form"]["name"].value;
  var last_name_checker = document.forms["contact_form"]["last_name"].value;
  var message_checker = document.forms["contact_form"]["message"].value;
  if (name_checker == "") {
    alert("Please enter your name in the 'First Name' field.");
    return false;
  }
  if (last_name_checker == "") {
    alert("Please enter your last name in the 'Last Name' field.");
    return false;
  }

  // Using CSS 'required' for email checking, as more robust
  if (message_checker == "") {
    alert(
      "Oops! You've forgotten to add a message! Please send one through in the 'Enter your message' field."
    );
    return false;
  }
}
