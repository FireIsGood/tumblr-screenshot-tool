let loading = false; // Prevent multiple canvas screenshots at the same time

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
  // Replace SVG elements to be inline
  const svgToReplace = wrapper.find("use[href^='#']");
  svgToReplace.replaceWith(function (i) {
    const iconId = $(svgToReplace[i]).attr("href");
    const svgReplacement = svgDefinitions.find(iconId).clone();
    return svgReplacement ?? svgToReplace[i];
  });

  // Replace Image elements with local elements
  const imgToReplace = wrapper.find("img");
  imgToReplace.replaceWith(function (i) {
    const elem = imgToReplace[i];
    const sources = elem.srcset.split(" ");
    const replacementUrl = sources[sources.length - 2];

    fetch(replacementUrl)
      .then((result) => result.blob())
      .then((blob) => {
        elem.removeAttribute("srcset");
        elem.src = URL.createObjectURL(blob);
      });
    return elem;
  });

  // Replace timestamps with actual times
  const timeToReplace = wrapper.find("time");
  timeToReplace.replaceWith(function (i) {
    const elem = timeToReplace[i];
    const timestamp = moment(elem.dateTime);
    elem.innerText = timestamp.format("MMM D, YYYY");

    return elem;
  });
}

function downloadCanvas(canvasImg, fileName) {
  const downloadLink = document.createElement("a");
  downloadLink.href = canvasImg.toDataURL();
  downloadLink.download = fileName;
  downloadLink.click();
}

$(async function () {
  const svgDefinitions = $("#svg-definitions");
  const postHtml = $("#post-html");
  const postLinkWrapper = $("#post-link");
  const postWrapper = $("#post-wrapper");
  const postContainer = $("#post-wrapper-inner");
  const postImageContainer = $("#post-image-container");
  const screenshotPostButton = $("#screenshot-post");
  const saveButton = $("#save");
  const copyButton = $("#copy");
  const loader = $('<p class="loader">loading <span aria-busy="true"></span></p>');
  const stylePresetSet = $("#post-style");
  const additionalOptionSet = $("#additional-options");

  // Ensure output and buttons stay in sync
  function resetOutput() {
    postImageContainer.empty();
    copyButton.attr("disabled", true);
    saveButton.attr("disabled", true);
  }

  postHtml.on("input", function () {
    postContainer.empty();
    postLinkWrapper.val("");
    const sanitized = DOMPurify.sanitize(postHtml.val(), purifyConfig);
    postContainer.append(sanitized);
    processPost(postContainer, svgDefinitions);

    // Get the post URL via the user's name link and the reblog button
    const userLink = postContainer.find('header a[rel="author"]').attr("href");
    const reblogLink = postContainer.find('a[aria-label="Reblog"]').attr("href");
    const postSuffix = reblogLink.split("/").slice(3, -1).join("/"); // Cuts off the prefix and unneeded suffix
    const postLink = `https://www.tumblr.com${userLink}/${postSuffix}`;
    postLinkWrapper.val(postLink);

    resetOutput();
  });

  postLinkWrapper.click(function () {
    postLinkWrapper.select();
  });

  const stylePresetRadioButtons = stylePresetSet.find('[type="radio"]');
  const allPresets = [...stylePresetRadioButtons.map((_, elem) => elem.value)];
  stylePresetRadioButtons.on("change", function () {
    const styleName = this.value;

    // Remove all preset classes
    postWrapper.removeClass(allPresets);

    // Add the noted class
    postWrapper.addClass(styleName);
    resetOutput();
  });

  additionalOptionSet.find('[type="checkbox"]').on("change", function () {
    const styleName = this.value;
    postWrapper.toggleClass(styleName);
    resetOutput();
  });

  screenshotPostButton.click(async function () {
    if (loading) return;
    loading = true;
    postHtml.attr("disabled", true);
    screenshotPostButton.attr("disabled", true);

    postImageContainer.empty().append(loader);
    const canvas = await modernScreenshot.domToCanvas(postWrapper[0]);
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
});
