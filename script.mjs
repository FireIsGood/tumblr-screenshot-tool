function processSvgs(wrapper, svgDefinitions) {
  const toReplace = wrapper.find("use[href^='#']");
  toReplace.replaceWith(function (i) {
    const iconId = $(toReplace[i]).attr("href");
    const svgReplacement = svgDefinitions.find(iconId).clone();
    return svgReplacement ?? toReplace[i];
  });
}

$(async function () {
  const svgDefinitions = $("#svg-definitions");
  const postHtml = $("#post-html");
  const postWrapper = $("#post-wrapper");
  const postContainer = $("#post-wrapper-inner");
  const postImageContainer = $("#post-image-container");
  const screenshotPostButton = $("#screenshot-post");

  postHtml.on("input", function () {
    postContainer.empty();
    postContainer.append(postHtml.val());
    processSvgs(postContainer, svgDefinitions);
  });

  screenshotPostButton.click(function () {
    html2canvas(postWrapper[0], { allowTaint: true, scale: 1 }).then(function (canvas) {
      canvas.style.width = null;
      canvas.style.height = null;
      postImageContainer.empty().append(canvas);
    });
  });

  $.ajax({
    url: "managed.svg",
    dataType: "html",
  }).done(function (svgData) {
    svgDefinitions.empty().append(svgData);
  });
});
