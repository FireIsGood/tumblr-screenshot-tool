let loading = false; // Prevent multiple canvas screenshots at the same time
const additionalOptionValues =
  localStorageGet("additionalOptions") !== null ? JSON.parse(localStorageGet("additionalOptions")) : {};

const purifyConfig = {
  ADD_TAGS: ["use"],
};
const downloadToast = Toastify({
  text: "Downloaded!",
  duration: 3000,
  close: true,
  gravity: "bottom", // `top` or `bottom`
  position: "right", // `left`, `center` or `right`
});
const copyToast = Toastify({
  text: "Copied to Clipboard!",
  duration: 3000,
  close: true,
  gravity: "bottom", // `top` or `bottom`
  position: "right", // `left`, `center` or `right`
});

async function processPost(wrapper, svgDefinitions) {
  // Save links
  const postPath = wrapper.find('a[aria-label="Permalink"]').attr("href");
  const postLink = `https://www.tumblr.com${postPath}`;

  // Remove comments (yay Tumblr bug)
  const commentsElem = wrapper.find(".hgDsD.PsI3u");
  commentsElem.remove();

  // Replace SVG elements to be inline
  const svgToReplace = wrapper.find("use[href^='#']");
  svgToReplace.replaceWith(function () {
    const iconId = $(this).attr("href");
    const svgReplacement = svgDefinitions.find(iconId).clone();
    return svgReplacement ?? this;
  });

  // Strip href attributes from links
  const linkToReplace = wrapper.find("a[href]");
  linkToReplace.replaceWith(function () {
    $(this).attr("href", null);
    return this;
  });

  // Replace foreign Image elements with local elements
  const imgToReplace = wrapper.find("img");
  imgToReplace.replaceWith(function () {
    if (!this.srcset) return this; // If no source set, we don't need to replace it via the method below

    const sources = this.srcset.split(" ");
    const replacementUrl = sources[sources.length - 2];

    fetch(replacementUrl)
      .then((result) => result.blob())
      .then((blob) => {
        this.removeAttribute("srcset");
        this.src = URL.createObjectURL(blob);
      });
    return this;
  });

  // Replace timestamps with actual times
  const timeToReplace = wrapper.find("time");
  timeToReplace.replaceWith(function (i) {
    const elem = timeToReplace[i];
    const timestamp = moment(elem.dateTime);
    elem.innerText = timestamp.format("MMM D, YYYY");

    return elem;
  });

  return { postLink };
}

function downloadCanvas(canvasImg, fileName) {
  const downloadLink = document.createElement("a");
  downloadLink.href = canvasImg.toDataURL();
  downloadLink.download = fileName;
  downloadLink.click();
}

function localStorageGet(key) {
  if (!window.localStorage) return null;
  return window.localStorage.getItem(key);
}
function localStorageSet(key, value) {
  if (!window.localStorage) return null;
  window.localStorage.setItem(key, value);
}

$(async function () {
  const svgDefinitions = $("#svg-definitions");
  const postHtml = $("#post-html");
  const postLinkWrapper = $("#post-link");
  const postWrapper = $("#post-wrapper");
  const postContainer = $("#post-wrapper-inner");
  const postImageContainer = $("#post-image-container");
  const pasteClipboardButton = $("#paste-clipboard");
  const screenshotPostButton = $("#screenshot-post");
  const saveButton = $("#save");
  const copyButton = $("#copy");
  const loader = $('<p class="loader">loading <span id="loader-progress"></span> <span aria-busy="true"></span></p>');
  const stylePresetSet = $("#post-style");
  const additionalOptionSet = $("#additional-options");

  let stylePresetValue = localStorageGet("stylePreset") ?? "";

  // Ensure output and buttons stay in sync
  function resetOutput() {
    postImageContainer.empty();
    copyButton.attr("disabled", true);
    saveButton.attr("disabled", true);
  }

  // Update output preview box
  async function updatePreview() {
    postContainer.empty();
    postLinkWrapper.val("");
    const sanitized = DOMPurify.sanitize(postHtml.val(), purifyConfig);
    postContainer.append(sanitized);
    const { postLink } = await processPost(postContainer, svgDefinitions);
    postLinkWrapper.val(postLink ?? "");

    resetOutput();
  }

  // Update output area based on changes to input box
  postHtml.on("input", async function () {
    await updatePreview();
  });

  postLinkWrapper.click(function () {
    postLinkWrapper.select();
  });

  const stylePresetRadioButtons = stylePresetSet.find('[type="radio"]');
  const allPresets = [...stylePresetRadioButtons.map((_, elem) => elem.value)];
  stylePresetRadioButtons.on("change", function () {
    stylePresetValue = this.value;

    // Remove all preset classes
    postWrapper.removeClass(allPresets);

    // Add the noted class
    postWrapper.addClass(stylePresetValue);
    resetOutput();

    // Update saved settings
    localStorageSet("stylePreset", stylePresetValue);
  });

  // Toggle classes or do additional cases on specific checkboxes
  additionalOptionSet.find('[type="checkbox"]').on("change", async function () {
    const styleName = this.value;
    additionalOptionValues[this.value] = this.checked;

    postWrapper.toggleClass(styleName);
    resetOutput();

    // Update saved settings
    localStorageSet("additionalOptions", JSON.stringify(additionalOptionValues));

    // Re-render if we need to
    const rerenderStyles = ["classic-footer"];
    if (rerenderStyles.includes(styleName)) {
      await updatePreview();
    }
  });

  pasteClipboardButton.click(async function () {
    const text = await navigator.clipboard.readText();
    postHtml.val(text);
    postHtml[0].dispatchEvent(new InputEvent("input"));
  });

  screenshotPostButton.click(async function () {
    if (loading) return;
    loading = true;
    postHtml.attr("disabled", true);
    screenshotPostButton.attr("disabled", true);

    postImageContainer.empty().append(loader);
    const canvas = await modernScreenshot.domToCanvas(postWrapper[0], {
      debug: true,
      progress: (current, total) => {
        $("#loader-progress").text(`[${current}/${total}]`);
        console.log(`${current}/${total}`);
      },
    });
    canvas.style.width = null;
    canvas.style.height = null;

    postImageContainer.empty().append(canvas);

    postHtml.attr("disabled", null);
    screenshotPostButton.attr("disabled", null);
    saveButton.attr("disabled", null);
    copyButton.attr("disabled", null);

    loading = false;
  });

  saveButton.click(function () {
    const canvas = postImageContainer.children()[0];
    downloadCanvas(canvas, "post.png");
    downloadToast.showToast();
  });

  copyButton.click(function () {
    const canvas = postImageContainer.children()[0];
    canvas.toBlob((blob) => {
      navigator.clipboard
        .write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ])
        .then(() => {
          copyToast.showToast();
        });
    });
  });

  // Load SVG definitions (annoying to inline)
  $.ajax({
    url: "managed.svg",
    dataType: "html",
  }).done(function (svgData) {
    svgDefinitions.empty().append(svgData);
  });

  // Sync local storage
  stylePresetSet.find(`[value="${stylePresetValue}"]`).click();
  Object.entries(additionalOptionValues).forEach(([option, value]) => {
    const checkbox = additionalOptionSet.find(`[value="${option}"]`);
    if (checkbox.length === 0) return;

    if (checkbox[0].checked === value) return;
    additionalOptionSet.find(`[value="${option}"]`).click();
  });

  // Sync default Additional Options
  additionalOptionSet.find('[type="checkbox"]').each(function () {
    const name = this.value;
    const checked = this.checked;

    if (additionalOptionValues[name] !== undefined) {
    } else {
      additionalOptionValues[name] = checked;
    }
  });
});
