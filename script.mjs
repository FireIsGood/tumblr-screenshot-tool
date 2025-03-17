$(async function () {
  const postHtml = $("#post-html");
  const postWrapper = $("#post-wrapper");
  const postContainer = $("#post-wrapper-inner");
  const postImageContainer = $("#post-image-container");
  const screenshotPostButton = $("#screenshot-post");

  postHtml.on("input", function () {
    postContainer.empty();
    postContainer.append(postHtml.val());
  });

  screenshotPostButton.click(function () {
    html2canvas(postWrapper[0], { allowTaint: true, scale: 1 }).then(function (canvas) {
      canvas.style.width = null;
      canvas.style.height = null;
      postImageContainer.empty();
      postImageContainer.append(canvas);
    });
  });

  $.ajax({
    url: "managed.svg",
    dataType: "html",
  }).done(function (svgData) {
    $("head").append(svgData);
  });

  canvg();
});
