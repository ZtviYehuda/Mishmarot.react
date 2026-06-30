from PIL import Image
import os

def separate_logo():
    public_dir = r"c:\Users\nafta\OneDrive\שולחן העבודה\Mishmarot.react-master\frontend\public"
    orig_path = os.path.join(public_dir, "toren_logo.png")
    
    img = Image.open(orig_path).convert("RGBA")
    width, height = img.size
    
    # 1. Create Base Image (No beam)
    base_img = img.copy()
    base_pixels = base_img.load()
    
    # 2. Create Beam Image (Only beam)
    beam_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    beam_pixels = beam_img.load()
    orig_pixels = img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = orig_pixels[x, y]
            # Detect the beam on the left of the lantern
            is_beam = (x < 380 and 200 <= y <= 450 and r > 40 and g > 40 and b > 40 and a > 0)
            
            if is_beam:
                # Keep it in beam image, erase it in base image
                beam_pixels[x, y] = (r, g, b, a)
                base_pixels[x, y] = (0, 0, 0, 0)
            else:
                # Keep in base, keep transparent in beam
                pass
                
    base_img.save(os.path.join(public_dir, "toren_logo_base.png"))
    beam_img.save(os.path.join(public_dir, "toren_logo_beam.png"))
    print("Logo successfully separated into toren_logo_base.png and toren_logo_beam.png!")

if __name__ == "__main__":
    separate_logo()
