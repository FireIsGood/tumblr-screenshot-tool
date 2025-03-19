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
    const sources = imgToReplace[i].srcset.split(" ");
    const replacementUrl = sources[sources.length - 2];

    fetch(replacementUrl)
      .then((result) => result.blob())
      .then((blob) => {
        imgToReplace[i].removeAttribute("srcset");
        imgToReplace[i].src = URL.createObjectURL(blob);
      });
    return imgToReplace[i];
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
  const postWrapper = $("#post-wrapper");
  const postContainer = $("#post-wrapper-inner");
  const postImageContainer = $("#post-image-container");
  const screenshotPostButton = $("#screenshot-post");
  const saveButton = $("#save");
  const copyButton = $("#copy");
  const loader = $('<p class="loader">loading <span aria-busy="true"></span></p>');

  postHtml.on("input", function () {
    postContainer.empty();
    const sanitized = DOMPurify.sanitize(postHtml.val(), purifyConfig);
    postContainer.append(sanitized);
    processPost(postContainer, svgDefinitions);

    postImageContainer.empty();
    copyButton.attr("disabled", true);
    saveButton.attr("disabled", true);
  });

  screenshotPostButton.click(async function () {
    if (loading) return;
    loading = true;
    postHtml.attr("disabled", true);

    postImageContainer.empty().append(loader);
    const canvas = await modernScreenshot.domToCanvas(postWrapper[0]);
    canvas.style.width = null;
    canvas.style.height = null;

    postImageContainer.empty().append(canvas);

    postHtml.attr("disabled", null);
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

  $.ajax({
    url: "managed.svg",
    dataType: "html",
  }).done(function (svgData) {
    svgDefinitions.empty().append(svgData);
  });
});
