export function createFooterMarkup(notes) {
  const count = notes.toLocaleString("en");
  return `<footer aria-label="Post Footer" class="tOKgq" role="contentinfo">
  <div class="m5KTc">
    <div class="gstmW">
      <div>
        <button class="TRX6J rlv6m">
          <span class="EvhBA RHkx9" tabindex="-1"
            ><span class="zrO3e"
              ><span data-testid="noteCountTotal"
                ><div class="vE6sH">
                  <span class="xu5ZG" title="${count}"><span class="lJK40">${count}</span> notes</span>
                </div></span
              ></span
            ></span
          >
        </button>
      </div>
    </div>
    <div class="MCavR">
      <div class="sfGru">
        <button class="TRX6J" aria-label="Share">
          <span class="EvhBA" tabindex="-1"
            ><svg
              height="24"
              role="presentation"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
              style="--icon-color-primary: rgba(var(--black), 0.65)"
            >
              <use href="#managed-icon__share-icon-proper"></use></svg
          ></span>
        </button>
      </div>
      <div class="sfGru">
        <span class="Vcrhu" data-testid="controlled-popover-wrapper" style="height: 100%"
          ><span class="Vcrhu"
            ><a aria-label="Reblog" class="fvSXi qRMZE"
              ><svg
                height="21"
                role="presentation"
                width="21"
                xmlns="http://www.w3.org/2000/svg"
                style="--icon-color-primary: rgba(var(--black), 0.65)"
              >
                <use href="#managed-icon__reblog"></use></svg></a></span
        ></span>
      </div>
      <div class="sfGru">
        <span class="Vcrhu" data-testid="controlled-popover-wrapper" style="height: 100%"
          ><span class="Vcrhu"
            ><button class="TRX6J">
              <span class="EvhBA B1Z5w" tabindex="-1"
                ><svg
                  height="21"
                  role="presentation"
                  width="23"
                  xmlns="http://www.w3.org/2000/svg"
                  style="--icon-color-primary: rgba(var(--black), 0.65)"
                >
                  <use href="#managed-icon__like-empty"></use></svg
              ></span></button></span
        ></span>
      </div>
    </div>
  </div>
  <div class="yTb5J"></div>
</footer>`;
}
