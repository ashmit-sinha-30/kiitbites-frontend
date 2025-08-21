import React, { useState, useEffect, useRef } from "react";
import * as Switch from "@radix-ui/react-switch";
import styles from "../styles/UploadItemForm.module.scss";

interface UploadItemFormProps {
  universityId: string;
}

export const UploadItemForm: React.FC<UploadItemFormProps> = ({ universityId }) => {
  const [itemType, setItemType] = useState("Retail");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [priceIncludingTax, setPriceIncludingTax] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [gstPercentage, setGstPercentage] = useState("");
  const [isSpecial, setIsSpecial] = useState("N");
  const [image, setImage] = useState<File | null>(null);
  const [cloudName, setCloudName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [packable, setPackable] = useState(itemType === "Produce");
  const [hsnSuggestions, setHsnSuggestions] = useState<Array<{hsnCode: string, count: number, gstPercentage: number, items: string[]}>>([]);
  const [showHsnSuggestions, setShowHsnSuggestions] = useState(false);
  const [loadingHsnSuggestions, setLoadingHsnSuggestions] = useState(false);

  // Calculate price excluding tax and SGST/CGST
  const calculateTaxDetails = () => {
    if (!priceIncludingTax || !gstPercentage) return null;
    
    const priceIncludingTaxNum = parseFloat(priceIncludingTax);
    const gstPercentageNum = parseFloat(gstPercentage);
    
    if (isNaN(priceIncludingTaxNum) || isNaN(gstPercentageNum)) return null;
    
    const priceExcludingTax = priceIncludingTaxNum / (1 + gstPercentageNum / 100);
    const sgstPercentage = gstPercentageNum / 2;
    const cgstPercentage = gstPercentageNum / 2;
    
    return {
      priceExcludingTax: Math.round(priceExcludingTax * 100) / 100,
      sgstPercentage: Math.round(sgstPercentage * 100) / 100,
      cgstPercentage: Math.round(cgstPercentage * 100) / 100
    };
  };

  const taxDetails = calculateTaxDetails();

  // Fetch HSN code suggestions when type is selected
  const fetchHsnSuggestions = async (selectedType: string) => {
    if (!selectedType) {
      setHsnSuggestions([]);
      setShowHsnSuggestions(false);
      setLoadingHsnSuggestions(false);
      return;
    }

    setLoadingHsnSuggestions(true);
    setShowHsnSuggestions(false);

    try {
      // First try to get suggestions from the specific category
      const categoryEndpoint = `/api/item/hsn-suggestions/${itemType.toLowerCase()}/${selectedType}`;
      const categoryRes = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + categoryEndpoint);
      
      if (categoryRes.ok) {
        const categoryData = await categoryRes.json();
        console.log('Category HSN suggestions response:', categoryData); // Debug log
        
        if (categoryData.success && categoryData.suggestions.length > 0) {
          setHsnSuggestions(categoryData.suggestions);
          setShowHsnSuggestions(true);
          setLoadingHsnSuggestions(false);
          return;
        }
      }
      
      // If no category-specific suggestions, try common HSN codes
      const commonEndpoint = `/api/item/common-hsn/${selectedType}`;
      const commonRes = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + commonEndpoint);
      
      if (commonRes.ok) {
        const commonData = await commonRes.json();
        console.log('Common HSN suggestions response:', commonData); // Debug log
        
        if (commonData.success && commonData.suggestions.length > 0) {
          setHsnSuggestions(commonData.suggestions);
          setShowHsnSuggestions(true);
        } else {
          setHsnSuggestions([]);
          setShowHsnSuggestions(false);
        }
      }
    } catch (err) {
      console.error("Error fetching HSN suggestions:", err);
      setHsnSuggestions([]);
      setShowHsnSuggestions(false);
    } finally {
      setLoadingHsnSuggestions(false);
    }
  };

  // Handle type selection and fetch HSN suggestions
  const handleTypeChange = (selectedType: string) => {
    setType(selectedType);
    if (selectedType) {
      fetchHsnSuggestions(selectedType);
    } else {
      setHsnSuggestions([]);
      setShowHsnSuggestions(false);
    }
  };

  // Handle HSN code selection from suggestions
  const handleHsnSuggestionClick = (suggestion: {hsnCode: string, count: number, gstPercentage: number, items: string[]}) => {
    console.log('HSN Suggestion clicked:', suggestion); // Debug log
    
    // Additional safety check
    if (!suggestion || !suggestion.hsnCode) {
      console.error('Invalid suggestion object:', suggestion);
      return;
    }
    
    setHsnCode(suggestion.hsnCode);
    
    // Validate GST percentage before setting it
    if (suggestion.gstPercentage != null && suggestion.gstPercentage !== undefined) {
      setGstPercentage(suggestion.gstPercentage.toString());
    } else {
      console.warn('GST percentage is undefined or null for suggestion:', suggestion);
      // Set a default value or show an error
      setGstPercentage("");
    }
    
    setShowHsnSuggestions(false);
  };

  useEffect(() => {
    const fetchCloudName = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/cloudinary/cloud-name");
        const data = await res.json();
        if (data.cloudName) setCloudName(data.cloudName);
        else throw new Error("Cloud name not found");
      } catch {
        setError("Failed to fetch Cloudinary cloud name");
      }
    };
    fetchCloudName();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      setType(""); // Reset type selection
      try {
        const endpoint = itemType === "Retail" ? "/api/item/types/retail" : "/api/item/types/produce";
        const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + endpoint);
        const data = await res.json();
        setTypes(data.types || []);
      } catch {
        setTypes([]);
      }
    };
    fetchTypes();
    setPackable(itemType === "Produce"); // Reset packable default when type changes
  }, [itemType]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setError("");
      setSuccess("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      setError("Please select a type.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let imageUrl = "";
      if (image && cloudName) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("upload_preset", "bitesbay");
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!data.secure_url) throw new Error("Failed to upload image to Cloudinary");
        imageUrl = data.secure_url;
      }
      const endpoint = itemType === "Retail" ? "/api/item/retail" : "/api/item/produce";
      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          price: parseFloat(priceIncludingTax), // This will be the price including tax
          priceExcludingTax: taxDetails?.priceExcludingTax,
          hsnCode,
          gstPercentage: parseFloat(gstPercentage),
          sgstPercentage: taxDetails?.sgstPercentage,
          cgstPercentage: taxDetails?.cgstPercentage,
          isSpecial,
          image: imageUrl,
          uniId: universityId,
          packable,
        }),
      });
      if (!res.ok) throw new Error("Failed to create item");
      setSuccess("Item uploaded successfully!");
      setName("");
      setType("");
      setPriceIncludingTax("");
      setHsnCode("");
      setGstPercentage("");
      setIsSpecial("N");
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setHsnSuggestions([]);
      setShowHsnSuggestions(false);
      setLoadingHsnSuggestions(false);
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.uploadItemContainer}>
      <h3 className={styles.title}>Upload New Item</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Type
          <select value={itemType} onChange={e => setItemType(e.target.value)} className={styles.input}>
            <option value="Retail">Retail</option>
            <option value="Produce">Produce</option>
          </select>
        </label>
        <label className={styles.label}>
          Name
          <input value={name} onChange={e => setName(e.target.value)} required className={styles.input} />
        </label>
        <label className={styles.label}>
          Types
          <select value={type} onChange={e => handleTypeChange(e.target.value)} required className={styles.input}>
            <option value="" disabled>Select type…</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className={styles.label}>
          Price Including Taxes
          <input type="number" value={priceIncludingTax} onChange={e => setPriceIncludingTax(e.target.value)} required min="0" step="0.01" className={styles.input} />
        </label>
        <label className={styles.label}>
          HSN Code
          <input type="text" value={hsnCode} onChange={e => setHsnCode(e.target.value)} className={styles.input} />
        </label>

        {/* HSN Suggestions Loading */}
        {loadingHsnSuggestions && (
          <div className={styles.hsnSuggestionsLoading}>
            <div className={styles.loadingSpinner}></div>
            <span>Loading HSN code suggestions...</span>
          </div>
        )}

        {/* HSN Suggestions */}
        {showHsnSuggestions && hsnSuggestions.length > 0 && (
          <div className={styles.hsnSuggestions}>
            <h4>HSN Code Suggestions</h4>
            <p className={styles.suggestionNote}>Click on a suggestion to auto-fill both HSN code and GST percentage:</p>
            {hsnSuggestions
              .filter(suggestion => suggestion && suggestion.hsnCode) // Filter out null/undefined suggestions
              .map(suggestion => (
                <div
                  key={suggestion.hsnCode}
                  className={styles.hsnSuggestionItem}
                  onClick={() => handleHsnSuggestionClick(suggestion)}
                >
                  <div className={styles.hsnCode}>{suggestion.hsnCode}</div>
                  <div className={styles.suggestionDetails}>
                    <span className={styles.itemCount}>
                      {suggestion.count || 0} item{(suggestion.count || 0) > 1 ? 's' : ''}
                    </span>
                    <span className={styles.gstPercentage}>
                      GST: {suggestion.gstPercentage != null ? `${suggestion.gstPercentage}%` : 'Not available'}
                    </span>
                    <span className={styles.itemNames}>
                      {(suggestion.items || []).slice(0, 3).join(', ')}
                      {(suggestion.items || []).length > 3 ? '...' : ''}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}

        <label className={styles.label}>
          GST Percentage
          <input type="number" value={gstPercentage} onChange={e => setGstPercentage(e.target.value)} required min="0" step="0.01" className={styles.input} />
        </label>

        {/* Tax Calculation Display */}
        {taxDetails && (
          <div className={styles.taxCalculation}>
            <h4>Tax Calculation</h4>
            <div className={styles.taxRow}>
              <span>Price Excluding Tax:</span>
              <span>₹{taxDetails.priceExcludingTax}</span>
            </div>
            <div className={styles.taxRow}>
              <span>SGST ({taxDetails.sgstPercentage}%):</span>
              <span>₹{((taxDetails.priceExcludingTax * taxDetails.sgstPercentage) / 100).toFixed(2)}</span>
            </div>
            <div className={styles.taxRow}>
              <span>CGST ({taxDetails.cgstPercentage}%):</span>
              <span>₹{((taxDetails.priceExcludingTax * taxDetails.cgstPercentage) / 100).toFixed(2)}</span>
            </div>
            <div className={styles.taxRow}>
              <span>Total Tax:</span>
              <span>₹{(parseFloat(priceIncludingTax) - taxDetails.priceExcludingTax).toFixed(2)}</span>
            </div>
            <div className={styles.taxRow}>
              <span>Price Including Tax:</span>
              <span>₹{priceIncludingTax}</span>
            </div>
          </div>
        )}

        {/* HSN Suggestions */}
        {showHsnSuggestions && hsnSuggestions.length > 0 && (
          <div className={styles.hsnSuggestions}>
            <h4>HSN Suggestions</h4>
            {hsnSuggestions.map(suggestion => (
              <div
                key={suggestion.hsnCode}
                className={styles.hsnSuggestionItem}
                onClick={() => handleHsnSuggestionClick(suggestion)}
              >
                <span>{suggestion.hsnCode} - {suggestion.count} items</span>
              </div>
            ))}
          </div>
        )}

        <label className={styles.label}>
          Is Special
          <select value={isSpecial} onChange={e => setIsSpecial(e.target.value)} className={styles.input}>
            <option value="Y">Yes</option>
            <option value="N">No</option>
          </select>
        </label>
        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Packable</span>
          <Switch.Root
            className="w-[42px] h-[25px] bg-gray-200 rounded-full relative shadow-[0_2px_10px] shadow-gray-400 focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-blue-600 outline-none cursor-default"
            checked={packable}
            onCheckedChange={setPackable}
          >
            <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-gray-400 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
          </Switch.Root>
        </label>
        <label className={styles.label}>
          Image
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className={styles.input} />
        </label>
        <button type="submit" disabled={loading || !cloudName} className={styles.button}>
          {loading ? "Uploading..." : "Upload Item"}
        </button>
        {success && <div className={styles.success}>{success}</div>}
        {error && <div className={styles.error}>{error}</div>}
      </form>
    </div>
  );
}; 