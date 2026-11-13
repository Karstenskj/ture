import Foundation
import Vision
import ImageIO
import CoreGraphics
let spec = try JSONSerialization.jsonObject(with:Data(contentsOf:URL(fileURLWithPath:CommandLine.arguments[1]))) as! [[String:Any]]
for item in spec {
 do {
  let path=item["path"] as! String, id=item["id"] as! String, r=item["rect"] as! [Double]
  let source=CGImageSourceCreateWithURL(URL(fileURLWithPath:path) as CFURL,nil)!
  let original=CGImageSourceCreateImageAtIndex(source,0,nil)!
  let rect=CGRect(x:r[0],y:r[1],width:r[2],height:r[3]).intersection(CGRect(x:0,y:0,width:original.width,height:original.height)).integral
  let crop=original.cropping(to:rect)!
  let scale=512/Double(crop.width), h=Int((Double(crop.height)*scale).rounded())
  let context=CGContext(data:nil,width:512,height:h,bitsPerComponent:8,bytesPerRow:0,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
  context.setFillColor(CGColor(gray:1,alpha:1));context.fill(CGRect(x:0,y:0,width:512,height:h));context.draw(crop,in:CGRect(x:0,y:0,width:512,height:h))
  let request=VNDetectFaceLandmarksRequest()
  try VNImageRequestHandler(cgImage:context.makeImage()!,options:[:]).perform([request])
  var faces:[[String:Any]]=[]
  for face in request.results ?? [] {
   func point(_ region: VNFaceLandmarkRegion2D?) -> [Double]? {
    guard let p=region?.normalizedPoints, !p.isEmpty else{return nil}
    let x=p.reduce(0){$0+$1.x}/CGFloat(p.count), y=p.reduce(0){$0+$1.y}/CGFloat(p.count), b=face.boundingBox
    return [Double(rect.minX)+Double(b.minX+x*b.width)*512/scale,Double(rect.minY)+Double(1-b.minY-y*b.height)*Double(h)/scale]
   }
   if let e1=point(face.landmarks?.leftEye),let e2=point(face.landmarks?.rightEye),let m=point(face.landmarks?.outerLips) {
    faces.append(["eyes":[e1,e2].sorted{$0[0]<$1[0]},"mouth":m,"confidence":face.confidence])
   }
  }
  let result:[String:Any] = ["id":id,"faces":faces]
  print(String(data:try JSONSerialization.data(withJSONObject:result,options:[.sortedKeys]),encoding:.utf8)!)
 } catch {print("ERROR \(item): \(error)")}
}
