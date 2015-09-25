import React from "react";

import Table from "react-bootstrap/lib/Table";

import PartStore from "../stores/part-store";
import SiteStore from "../stores/site-store";

export default class PartPage extends React.Component {
  constructor() {
    super();
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.onSiteChange = this.onSiteChange.bind(this);
    this.onPartChange = this.onPartChange.bind(this);
    this.state = {"partID": null,
                  "parts": null};
  }

  componentDidMount() {
    SiteStore.listen(this.onSiteChange);
    PartStore.listen(this.onPartChange);
  }

  componentWillUnmount() {
    SiteStore.unlisten(this.onSiteChange);
    PartStore.unlisten(this.onPartChange);
  }

  onSiteChange(state) {
    if (state.activePart) {
      this.setState({"partID": state.activePart});
    }
  }

  onPartChange(state) {
    this.setState({"parts": state.parts});
  }

  static getSite(url) {
    var parser = document.createElement("a");
    parser.href = url;
    return parser.hostname.replace("www.", "");
  }

  static trackOutboundLink(url, redirect) {
    ga("send", "event", "outbound", "click", url, {"hitCallback":
      function () {
        if (redirect) {
          document.location = url;
        }
      }
    });
  }

  onClick(url, event) {
    let redirect = !event.ctrlKey && !event.metaKey && event.nativeEvent.button === 0;
    PartPage.trackOutboundLink(url, redirect);
    if (redirect) {
      if (event.preventDefault) {
        event.preventDefault();
      } else {
        event.returnValue = !1;
      }
    }
  }

  render() {
    if (!this.state.partID || !this.state.parts || !this.state.parts[this.state.partID.path]) {
      return <div>Loading...</div>;
    }
    let part = this.state.parts[this.state.partID.path];

    // Convert to variants.
    let variants;
    if (!part["version"]) {
      variants = [];
      for (let i = 0; i < part.urls["store"].length; i++) {
        let url = part.urls["store"][i];
        variants.push({"url": url});
      }
    } else {
      variants = part.variants;
    }
    let variants_by_site = {};
    for (let i = 0; i < variants.length; i++) {
      let url = variants[i].url;
      let site = PartPage.getSite(url);
      if (!(site in variants_by_site)) {
        variants_by_site[site] = [];
      }
      variants_by_site[site].push(variants[i]);
    }
    let content = [];
    for (let site of Object.keys(variants_by_site)) {
      let url = "http://" + site;
      content.push((
        <tr key={site}>
          <th colSpan={4}><a href={ url } onClick={ this.onClick.bind(this, url) }>{site}</a></th>
        </tr>));
      for (let i = 0; i < variants_by_site[site].length; i++) {
        let variant = variants_by_site[site][i];
        let url = variant.url;
        let description;
        if (variant.description) {
          description = variant.description;
        } else {
          description = <span className="unknown">Unknown</span>;
        }
        let quantity;
        if (variant.quantity) {
          quantity = <span className="known">{variant.quantity}</span>;
        } else {
          quantity = <span className="unknown">1</span>;
        }
        let price_per_unit;
        if (variant.price) {
          price_per_unit = <span className="known">{variant.price}</span>;
        } else {
          price_per_unit = <span className="unknown">$$</span>;
        }
        let stock;
        if (variant.stock_state) {
          stock = <span className={ variant.stock_state }>{variant.stock_text}</span>;
        } else {
          stock = <span className="unknown">Unknown</span>;
        }
        let callback = this.onClick.bind(this, url);
        content.push((
          <tr key={url}>
            <td><a href={url} onClick={ callback }>{ description }</a></td>
            <td><a href={url} onClick={ callback }>{ quantity }</a></td>
            <td><a href={url} onClick={ callback }>{ price_per_unit }</a></td>
            <td><a href={url} onClick={ callback }>{ stock }</a></td>
          </tr>));
      }
    }
    let variant_table = (<Table condensed hover id="part-variants" striped>
    <thead>
      <tr>
        <th>Descripton</th>
        <th>Quantity</th>
        <th>Price Per Unit</th>
        <th>Stock</th>
      </tr>
    </thead>
    <tbody>
      { content }
    </tbody>
    </Table>);
    return (<div><h1>{part.manufacturer + " " + part.name}</h1>{variant_table}</div>)
  }
}
